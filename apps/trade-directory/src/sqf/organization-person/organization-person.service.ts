import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateOrganizationPersonKafkaMessageReplyType,
  CreateOrganizationPersonKafkaMessageType,
} from '@app/common/apps/trade-directory/types/kafka-message.type';
import {
  OrganizationPersonRepository,
  OrganizationRepository,
  PersonRepository,
} from '../../repositories';
import { OrganizationPerson, Person, ResetPasswordToken } from '../../models';
import { ResetPasswordTokenRepository } from '../../repositories/reset-password-token.repository';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class OrganizationPersonService {
  constructor(
    private readonly organizationPersonRepository: OrganizationPersonRepository,
    private readonly personRepository: PersonRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly resetRepository: ResetPasswordTokenRepository,
    private readonly configService: ConfigService,
  ) {}

  async handleCreateNewOrganizationPerson(
    message: CreateOrganizationPersonKafkaMessageType,
  ): Promise<CreateOrganizationPersonKafkaMessageReplyType[]> {
    try {
      // Query the organization using organizationId from Kafka message
      const organization = await this.organizationRepository.findOne({
        where: {
          id: message.organizationId,
        },
      });

      // Throw error if organization does not exist
      if (!organization) {
        throw new NotFoundException(
          `Error in handleCreateNewOrganizationPerson(): Organization not found for organizationId: ${message.organizationId}`,
        );
      }

      // Array to collect all saved organization-person mappings
      const savedOrganizationPersonsArray: CreateOrganizationPersonKafkaMessageReplyType[] =
        [];

      // Loop through each person in the message data
      for (const person of message.data) {
        // Create a new Person entity
        const personEntity = new Person({
          name: person.name,
          preferredUsername: person.preferredUsername,
          residentialAddress: person.residentialAddress,
          identificationNumber: person.identificationNumber,
          mobileNumber: person.mobileNumber,
          email: person.email,
        });

        const token = Math.random().toString(20).substring(2, 12);

        const tokenExpirationAt = new Date(
          new Date().getTime() +
            this.configService.get('TOKEN_EXPIRATION') * 1000,
        );

        const reset = new ResetPasswordToken({
          email: person.email,
          token,
          tokenExpirationAt,
        });

        await this.resetRepository.create(reset);

        // Save the person in the database
        const savedPerson = await this.personRepository.save(personEntity);

        // Create a new OrganizationPerson entity
        const organizationPersonEntity = new OrganizationPerson({
          organizationId: organization.id,
          personId: savedPerson.id,
          designation: person.designation,
        });

        // Save the organization-person mapping in the database
        const savedOrganizationPerson =
          await this.organizationPersonRepository.save(
            organizationPersonEntity,
          );

        // Add the saved organization-person mapping to the array
        savedOrganizationPersonsArray.push({
          data: {
            id: savedOrganizationPerson.id,
            organizationId: savedOrganizationPerson.organizationId!,
            personId: savedPerson.id,
            designation: savedOrganizationPerson.designation!,
            createdAt: savedOrganizationPerson.createdAt,
            updatedAt: savedOrganizationPerson.updatedAt,
          },
          token: token,
        });
      }

      return savedOrganizationPersonsArray;
    } catch (error) {
      console.error('Error processing Kafka message:', error);
      throw error;
    }
  }

  async findOrganizationPersonByOrganizationIdEvent(organizationId: number) {
    try {
      // Check if organization exists
      const organization = await this.organizationRepository.findOne({
        where: {
          id: organizationId,
        },
      });

      // If organization not found, throw 404 error
      if (!organization) {

        return [];
      }

      const organizationPersons = await this.organizationPersonRepository.find({
        where: {
          organizationId: organizationId,
        },
        relations: ['person'],
        order: { personId: 'ASC' },
      });

      // Structure the response into the desired format
      return organizationPersons.map((orgPerson) => ({
        id: orgPerson.id,
        organizationId: orgPerson.organizationId,
        personId: orgPerson.personId,
        name: orgPerson.person?.name || null,
        residentialAddress: orgPerson.person?.residentialAddress || null,
        identificationNumber: orgPerson.person?.identificationNumber || null,
        mobileNumber: orgPerson.person?.mobileNumber || null,
        email: orgPerson.person?.email || null,
        designation: orgPerson.designation,
        createdAt: orgPerson.createdAt,
        updatedAt: orgPerson.updatedAt,
      }));
    } catch (error) {
      console.error(
        `Error fetching organization persons for ${organizationId} in Kafka SQF_GET_ORGANIZATION_PERSON_BY_ID:`,
        error,
      );
      return []; // Return empty array if failed
    }
  }
}
