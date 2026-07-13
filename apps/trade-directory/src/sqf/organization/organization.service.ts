import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationRepository } from '../../repositories/organization.repository';
import {
  ClientPersona,
  BuyerPersona,
  FunderPersona,
  Organization,
  SupplierPersona,
} from '../../models';
import { TRADE_SERVICE } from '@app/common/constants/services';
import { ClientKafka } from '@nestjs/microservices';
import {
  CreateOrganizationKafkaMessageReplyType,
  CreateOrganizationKafkaMessageType,
} from '@app/common/apps/trade-directory/types/kafka-message.type';
import { getCountryNameByCode } from '@app/common/constants/countries';
import { FindOrganizationByIdDto } from './dto/find-organization-by-id-dto';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { format } from 'date-fns';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    @Inject(TRADE_SERVICE) private readonly kafkaProducer: ClientKafka, // Injecting Kafka client
    private readonly httpService: HttpService, // To fetch applications from another microservice
  ) {}

  onModuleInit() {
    // subscribeToResponseOf: Tells the Kafka producer to listen for a response from a specific kafka topic.
    // Use this for request-response patterns to ensure the producer can receive responses from the consumer.
    // Without this, the producer sends the message but won't get the consumer's response.
    this.kafkaProducer.subscribeToResponseOf(
      KafkaTopicEnum.SQF_GET_ALL_APPLICATIONS,
    );

    this.kafkaProducer.subscribeToResponseOf(
      KafkaTopicEnum.SQF_GET_APPLICATIONS_BY_ORG_ID,
    );
  }

  async findOrganizationById(
    id: number,
    findOrganizationByIdBodyDto: FindOrganizationByIdDto,
  ) {
    try {
      const organization = await this.organizationRepository.findOne({
        select: [
          'id',
          'organizationName',
          'businessRegistrationNumber',
          'country',
          'organizationType',
          'organizationTypeOther',
          'taxIdentificationNumber',
          'businessSector',
          'registeredAddress',
          'postcode',
          'yearEstablished',
          'revenueCurrency',
          'revenueAmount',
          'emailAddress',
          'contactNumber',
          'companySize',
          'organizationWebsite',
          'createdAt',
          'updatedAt',
        ],
        where: {
          id: id,
        },
        relations: {
          organizationPersons: {
            person: true,
            organizationPersonRoles: true,
          },
          kycAgencyReports: findOrganizationByIdBodyDto.includeKycAgencyReports
            ? true
            : false,
        },
      });

      // If organization not found, throw 404 error
      if (!organization) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: `Organization with ID: ${id} not found`,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      let applications = [];

      // Fetch applications only if includeApplications is true
      if (findOrganizationByIdBodyDto.includeApplications) {
        // Fetch applications related to the organization from the Application in risk-operation Microservice
        const applicationsResponse = await firstValueFrom(
          this.kafkaProducer.send(
            KafkaTopicEnum.SQF_GET_APPLICATIONS_BY_ORG_ID,
            id,
          ),
        );

        applications = applicationsResponse || [];
      }

      // Exclude organizationPersons from the response
      const { organizationPersons, ...organizationData } = organization;

      return {
        statusCode: HttpStatus.OK,
        message: 'Organizations retrieved successfully.',
        data: {
          ...organizationData, // Organization details without organizationPersons
          ...(findOrganizationByIdBodyDto.includeApplications && {
            applications: applications,
          }), // Include applications only if the flag is true
        },
      };
    } catch (error) {
      // Handle unexpected errors
      console.error('Error fetching organization:', error);

      // Re-throw the HttpException to preserve its status and message
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to retrieve organization with ID: ${id}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAllOrganization(page: number, pageSize: number) {
    try {
      // Check if pagination parameters exist
      const shouldPaginate = page !== undefined && pageSize !== undefined;

      // Set take and skip values based on pagination
      const take = shouldPaginate ? Math.max(pageSize, 1) : undefined; // Ensure pageSize is at least 1 if provided
      const skip = shouldPaginate ? Math.max(page - 1, 0) * take : undefined; // Calculate skip only if pagination is applied

      const [organizations, totalCount] =
        await this.organizationRepository.findAndCount({
          select: [
            'id',
            'organizationName',
            'country',
            'emailAddress',
            'contactNumber',
            'createdAt',
          ],
          order: { createdAt: 'DESC' }, // Sort results by latest creation date
          take, // Apply pagination if shouldPaginate is true
          skip, // Apply pagination if shouldPaginate is true
        });

      // Fetch all applications from the Application in risk-operation microservice
      const applicationsResponse = await firstValueFrom(
        this.kafkaProducer.send(KafkaTopicEnum.SQF_GET_ALL_APPLICATIONS, {}), // empty {} payload means we just want to trigger an event without sending any additional request data
      );

      // Validate that the `data` field in the response is an array; otherwise, fallback to an empty array.
      const applications = Array.isArray(applicationsResponse)
        ? applicationsResponse
        : [];

      // Group applicationPersonas by organizationId
      // Make sure the applicationPersonas is unique, no repeatable persona
      const applicationsByOrganization: Record<number, string[]> = {};

      // Iterates over the applications array, which contains all application data fetched from the microservice.
      for (const app of applications) {
        // Extracts the organizationId from the current application
        const orgId = app.organizationId;

        // Checks if the applicationsByOrganization object already has an entry (key) for the current organizationId
        if (!applicationsByOrganization[orgId]) {
          applicationsByOrganization[orgId] = [];
        }

        // Ensures that the applicationPersona for the current application is not already in the array for the corresponding organizationId
        if (
          !applicationsByOrganization[orgId].includes(app.applicationPersona)
        ) {
          applicationsByOrganization[orgId].push(app.applicationPersona);
        }
      }

      // Transform response to include country name and add in applicationPersona array
      const transformedOrganizations = organizations.map((organization) => ({
        ...organization,
        createdAt: undefined, // Remove createdAt and replace it with onboardedAt
        onboardedAt: organization.createdAt
          ? format(
              new Date(organization.createdAt),
              'dd MMMM yyyy',
            ).toUpperCase()
          : null,
        country: getCountryNameByCode(organization.country).toUpperCase(), // Map code to name
        applicationPersonas: applicationsByOrganization[organization.id] || [], // Add grouped applicationPersonas to the organization
      }));

      // Meta data for pagination
      const meta = shouldPaginate
        ? {
            organizationsPerPage: take,
            currentPage: page,
            totalPages: Math.ceil(totalCount / take),
          }
        : undefined;

      return {
        statusCode: HttpStatus.OK,
        message: 'Organizations retrieved successfully.',
        totalOrganizations: totalCount,
        data: transformedOrganizations,
        ...(meta && { meta }), // Include meta only if pagination is applied
      };
    } catch (error) {
      console.error('Error fetching organizations:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      // Return a 500 error with the error message included
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve organizations.',
          error: error.message, // Include the original error message
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOrganizationByClientPersonaId(clientPersonaId: number) {
    const organization = await this.organizationRepository.findOne({
      where: {
        clientPersonaId: clientPersonaId,
      },
    });

    return organization;
  }

  async updateOrganizationById(
    id: number,
    updateOrganizationDto: UpdateOrganizationDto,
  ) {
    // Get organization to check if it exists
    const organization = await this.organizationRepository.findOne({
      where: {
        id: id,
      },
    });

    // Throw error if organization not found
    if (!organization) {
      throw new NotFoundException(`Organization with ID: ${id} not found`);
    }

    // Merge the updated fields with the existing organization
    // Typically only sending the fields that need to be changed, while keeping the other fields intact
    Object.assign(organization, updateOrganizationDto);

    try {
      // Save the updated organization back to the database
      await this.organizationRepository.save(organization);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to update organization for organizationId: ${id}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Organization updated successfully.',
      data: organization,
    };
  }

  // Kafka Consumer Event Processing for SQF_CREATE_ORGANIZATION topic
  async handleCreateNewOrganization(
    message: CreateOrganizationKafkaMessageType,
  ): Promise<CreateOrganizationKafkaMessageReplyType> {
    try {
      // Check if the organization already exists in the database
      const existingOrganization = await this.organizationRepository.findOne({
        where: {
          organizationName: message.data.organizationName,
        },
      });

      if (existingOrganization) {
        // If the organization exists, return it
        return existingOrganization;
      }

      // Create new organization if it does not exist
      const newOrganization = new Organization({
        ...message.data,
      });

      await this.organizationRepository.save(newOrganization);

      // Return the newly created organization
      return newOrganization;
    } catch (error) {
      // Log detailed error information if saving fails
      console.error('Error saving organization:', error.message, error);

      throw new HttpException(
        'Failed to create organization in the database',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateOnBoardingAt(id: number) {
    const updatedOrganization = await this.organizationRepository.findOne({
      where: { id },
    });

    updatedOrganization.fullyOnboardedAt = new Date();

    await this.organizationRepository.save(updatedOrganization);
    return { message: 'success' };
  }
}
