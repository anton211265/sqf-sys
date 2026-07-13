import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationRepository } from '../../repositories/application.repository';
import { Application } from '../../models';
import { ClientKafka } from '@nestjs/microservices';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { ApplicationStatusEnum } from '@app/common/apps/risk-operation/enums/application-status.enum';
import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import { firstValueFrom } from 'rxjs';
import {
  CreateApplicationPersonKafkaMessageType,
  CreateOrganizationKafkaMessageReplyType,
  CreateOrganizationKafkaMessageType,
  CreateOrganizationPersonKafkaMessageReplyType,
  CreateOrganizationPersonKafkaMessageType,
} from '@app/common/apps/trade-directory/types/kafka-message.type';
import { UpdateRepresentativeDetailsDto } from './dto/update-representative-details.dto';
import { SendEmailMessage } from '@app/common/apps/notification/types/kafka-message.type';
import { CreateApplicationDto } from './dto/create-application.dto';
import { GuarantorRelationshipToApplicantEnum } from '@app/common/apps/trade-directory/enums/guarantor-relationship-to-applicant.enum';
import { ConfigService } from '@nestjs/config';
import { GetApplicationsByOrgIdWithFilteringDto } from './dto/get-application-by-id.dto';
import { HttpService } from '@nestjs/axios';
import { ApplicationPersonTypeEnum } from '@app/common/apps/risk-operation/enums/application-person-type.enum';
import { ApplicationPersonService } from '../application-person/application-person.service';
import { CreateApplicationPersonDto } from '../application-person/dto/create-application-person.dto';
import { v4 as uuidv4 } from 'uuid';
import { RiskApplicationScoring } from '../../models/risk-application-scoring.entity';
import { RiskApplicationScoringRepository } from '../../repositories/risk-application-scoring.repository';
import { RiskProfileRepository } from '../../repositories/risk-profile.repository';
import { RiskQuantitativeProfileScoringService } from '../risk-quantitative-profile-scoring/risk-quantitative-profile-scoring.service';
import { RiskManualReviewAlertService } from '../risk-manual-review-alert/risk-manual-review-alert.service';
import { RiskManualReviewAlertRepository } from '../../repositories/risk-manual-review-alert.repository';
import { RiskFilter1StatusEnum } from '@app/common/apps/risk-operation/enums/risk-filter-1-status.enum';
import { RiskApplicationAuditLogService } from '../risk-application-audit-log/risk-application-audit-log.service';
import { RiskApplicationAuditActionEnum } from '@app/common/apps/risk-operation/enums/risk-application-audit-action.enum';
import { FinancialCreditReportService } from '../financial-credit-report/financial-credit-report.service';
import { OutboxEventRepository } from '../../repositories/outbox-event.repository';
import { EntityManager } from 'typeorm';

@Injectable()
export class ApplicationService {
  private frontEndUrl: string;

  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly riskApplicationScoringRepository: RiskApplicationScoringRepository,
    private readonly applicationPersonService: ApplicationPersonService,
    private configService: ConfigService,
    @Inject(DependencyInjectionTokenEnum.KAFKA_PRODUCER)
    private readonly kafkaProducer: ClientKafka,
    private readonly riskProfileRepository: RiskProfileRepository,
    private readonly riskQuantitativeProfileScoringService: RiskQuantitativeProfileScoringService,
    private readonly riskManualReviewAlertService: RiskManualReviewAlertService,
    private readonly riskManualReviewAlertRepository: RiskManualReviewAlertRepository,
    private readonly riskApplicationAuditLogService: RiskApplicationAuditLogService,
    private readonly httpService: HttpService, // To fetch applications from another microservice
    private readonly financialCreditReportService: FinancialCreditReportService,
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly entityManager: EntityManager,
  ) {
    this.frontEndUrl = this.configService.get<string>('FRONTEND_DOMAIN');
  }

  onModuleInit() {
    // subscribeToResponseOf: Tells the Kafka producer to listen for a response from a specific SQF_CREATE_ORGANIZATION topic.
    // Use this for request-response patterns to ensure the producer can receive responses from the consumer.
    // Without this, the producer sends the message but won't get the consumer's response.
    this.kafkaProducer.subscribeToResponseOf(
      KafkaTopicEnum.SQF_CREATE_ORGANIZATION,
    );

    this.kafkaProducer.subscribeToResponseOf(
      KafkaTopicEnum.SQF_CREATE_ORGANIZATION_PERSON,
    );

    this.kafkaProducer.subscribeToResponseOf(
      KafkaTopicEnum.SQF_GET_ORGANIZATION_PERSON_BY_ID,
    );

    this.kafkaProducer.subscribeToResponseOf(
      KafkaTopicEnum.SQF_GET_ORGANIZATION_BY_ID,
    );
  }

  async createNewApplication(createApplicationDto: CreateApplicationDto) {
    try {
      // Send the organization creation request to Kafka and wait for the response
      const clientOrganization = await firstValueFrom(
        this.kafkaProducer.send<
          CreateOrganizationKafkaMessageReplyType, // Expected response type from Kafka
          CreateOrganizationKafkaMessageType // Message type being sent to consumer
        >(
          KafkaTopicEnum.SQF_CREATE_ORGANIZATION, // Kafka topic
          {
            data: createApplicationDto.organization,
          },
        ),
      );

      // If no organization is returned from Kafka, throw an error
      if (!clientOrganization) {
        throw new Error('No organization response from Kafka.');
      }

      // Person In-Charge
      if (createApplicationDto.personInCharge) {
        // Person In-Charge must have 1 person only
        // Allow array due to current entity structure for clientPersonInCharge
        if (createApplicationDto.personInCharge.length !== 1) {
          throw new BadRequestException(
            'There must be exactly one person in-charge.',
          );
        }
      }

      const applicationPrefixMap = {
        BORROWER: 'BW',
        SUPPLIER: 'SP',
        INVESTOR: 'IV',
      };

      const prefix =
        applicationPrefixMap[createApplicationDto.applicationPersona];

      // Get short date (YYMMDD)
      const shortDate = new Date().toISOString().slice(2, 10).replace(/-/g, '');

      // Generate short UUID
      const uniqueId = uuidv4().split('-')[0];

      // Final application number
      const applicationNumber = `${prefix}-${shortDate}-${uniqueId}`;

      const newApplication = new Application({
        organizationId: clientOrganization.id,
        clientOrganizationName: clientOrganization.organizationName,
        applicationPersona: createApplicationDto.applicationPersona,
        applicationStatus: ApplicationStatusEnum.DRAFT,
        applicationDate: new Date(),
        applicationNumber,
      });

      // Save the new application to the database
      const savedApplication =
        await this.applicationRepository.save(newApplication);

      const message: CreateOrganizationPersonKafkaMessageType = {
        organizationId: clientOrganization.id,
        data: [
          // Map PIC
          ...createApplicationDto.personInCharge.map((pic) => ({
            name: pic.person.name,
            preferredUsername: null,
            residentialAddress: pic.person.residentialAddress,
            identificationNumber: pic.person.identificationNumber,
            mobileNumber: pic.person.mobileNumber,
            email: pic.person.email,
            designation: pic.organizationPerson.designation,
          })),
        ],
      };

      // Reply response of SQF_CREATE_ORGANIZATION_PERSON will be in array:
      // Example:

      // [
      //   {
      //     "id": 2831,
      //     "organizationId": 1156,
      //     "personId": 2646,
      //     "designation": "Manager",
      //     "createdAt": "2024-12-24T06:39:35.816Z",
      //     "updatedAt": "2024-12-24T06:39:35.816Z"
      //   },
      //   {
      //     "id": 2832,
      //     "organizationId": 1156,
      //     "personId": 2647,
      //     "designation": "Assistant Manager",
      //     "createdAt": "2024-12-24T06:40:00.000Z",
      //     "updatedAt": "2024-12-24T06:40:00.000Z"
      //   }
      // ]

      const createOrgPersonKafkaResponse: CreateOrganizationPersonKafkaMessageReplyType[] =
        await firstValueFrom(
          this.kafkaProducer.send<
            CreateOrganizationPersonKafkaMessageReplyType[], // Expected response type
            CreateOrganizationPersonKafkaMessageType // Sent message type
          >(KafkaTopicEnum.SQF_CREATE_ORGANIZATION_PERSON, message),
        );

      const orgPersonToken = createOrgPersonKafkaResponse.map(
        (item) => item.token,
      );
      const orgPersonResponse = createOrgPersonKafkaResponse.map(
        (item) => item.data,
      );

      const createApplicationPersonMessage: CreateApplicationPersonDto = {
        organizationId: clientOrganization.id,
        applicationId: savedApplication.id,
        applicationPersonType: ApplicationPersonTypeEnum.PIC,
        organizationPersons: orgPersonResponse,
      };

      // Call service to store Application Person
      await this.applicationPersonService.createNewApplicationPerson(
        createApplicationPersonMessage,
      );

      const emailReceivers = createApplicationDto.personInCharge.map(
        (pic) => pic.person.email,
      );

      const picName = createApplicationDto.personInCharge.map(
        (pic) => pic.person.name,
      );

      // Send email to PIC for setup new password — via outbox
      const setPasswordEmailId = uuidv4();
      await this.outboxEventRepository.record(this.entityManager, {
        id: setPasswordEmailId,
        topic: KafkaTopicEnum.SEND_EMAIL,
        payload: {
          eventId: setPasswordEmailId,
          emailSender: 'notification@sqf.ai',
          emailReceivers,
          emailCc: [],
          emailBcc: [],
          emailReplyTo: [],
          emailSubject: 'SQF.AI - Set Up Your Account Password ',
          emailTemplate: {
            templateName: '/application-client-set-new-password.pug',
            templateVariables: {
              receipientName: picName[0],
              setupNewPasswordLink: `${this.frontEndUrl}/auth/set-password?token=${orgPersonToken[0]}`,
            },
          },
        },
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'New application has been created.',
      };
    } catch (error) {
      console.error(
        'Error occurred during application creation: ',
        error.message,
        error,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to process application creation request',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateRepresentativeDetails(
    id: number,
    args: UpdateRepresentativeDetailsDto,
  ) {
    // Check if application exists
    const application = await this.applicationRepository.findOne({
      where: {
        id: id,
      },
    });

    // Throw error if application not exists
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Directors
    if (args.directors) {
      // Check if at least one director is an authorised signatory
      const hasAuthoriseSignatory = args.directors.some(
        (directorDto) => directorDto.authoriseSignatory === true,
      );

      if (!hasAuthoriseSignatory) {
        throw new BadRequestException(
          'At least one director must be an authorised signatory.',
        );
      }

      application.directors = args.directors.map((directorDto) => ({
        person: {
          name: directorDto.person.name,
          residentialAddress: directorDto.person.residentialAddress,
          identificationNumber: directorDto.person.identificationNumber,
          mobileNumber: directorDto.person.mobileNumber,
          email: directorDto.person.email,
        },
        organizationPerson: {
          designation: directorDto.organizationPerson.designation,
        },
        authoriseSignatory: directorDto.authoriseSignatory,
      }));
    }

    // Shareholders
    if (args.shareholders) {
      application.shareholders = args.shareholders.map((shareholderDto) => ({
        person: {
          name: shareholderDto.person.name,
          residentialAddress: shareholderDto.person.residentialAddress,
          identificationNumber: shareholderDto.person.identificationNumber,
          mobileNumber: shareholderDto.person.mobileNumber,
          email: shareholderDto.person.email,
        },
        organizationPerson: {
          designation: shareholderDto.organizationPerson.designation,
        },
        shareholdingPercentage: shareholderDto.shareholdingPercentage,
      }));
    }

    // Guarantors
    if (args.guarantors) {
      application.guarantors = args.guarantors.map((guarantorDto) => {
        // Validate relationshipToApplicant and relationshipToApplicantOther
        //    Scenario 1: relationshipToApplicant is "Other" and relationshipToApplicantOther is missing.
        //    Scenario 2: relationshipToApplicant is not "Other" and relationshipToApplicantOther is provided.
        if (
          (guarantorDto.relationshipToApplicant ===
            GuarantorRelationshipToApplicantEnum.Other &&
            !guarantorDto.relationshipToApplicantOther) ||
          (guarantorDto.relationshipToApplicant !==
            GuarantorRelationshipToApplicantEnum.Other &&
            guarantorDto.relationshipToApplicantOther)
        ) {
          throw new BadRequestException(
            'Invalid relationship details: "relationshipToApplicantOther" must be provided if "relationshipToApplicant" is "Other", and must be omitted otherwise.',
          );
        }

        return {
          person: {
            name: guarantorDto.person.name,
            residentialAddress: guarantorDto.person.residentialAddress,
            identificationNumber: guarantorDto.person.identificationNumber,
            mobileNumber: guarantorDto.person.mobileNumber,
            email: guarantorDto.person.email,
          },
          organizationPerson: {
            designation: guarantorDto.organizationPerson.designation,
          },
          relationshipToApplicant: guarantorDto.relationshipToApplicant,
          // Include relationshipToApplicantOther only if it exists
          ...(guarantorDto.relationshipToApplicant ===
            GuarantorRelationshipToApplicantEnum.Other &&
          guarantorDto.relationshipToApplicantOther
            ? {
                relationshipToApplicantOther:
                  guarantorDto.relationshipToApplicantOther,
              }
            : {}),
        };
      });
    }

    try {
      // Save the updated entity back to the database
      await this.applicationRepository.save(application);

      // ------------------------- Directors -------------------------

      const kafkaMessageForDirectors: CreateOrganizationPersonKafkaMessageType =
        {
          clientPersonaId: application.clientPersonaId,
          organizationId: application.organizationId,
          data: [
            // Map directors
            ...(application.directors ?? []).map((director) => ({
              name: director.person.name,
              preferredUsername: null,
              residentialAddress: director.person.residentialAddress,
              identificationNumber: director.person.identificationNumber,
              mobileNumber: director.person.mobileNumber,
              email: director.person.email,
              designation: director.organizationPerson.designation,
            })),
          ],
        };

      // Use kafka to store Organisation Person
      const createOrgPersonKafkaResponseForDirector: CreateOrganizationPersonKafkaMessageReplyType[] =
        await firstValueFrom(
          this.kafkaProducer.send<
            CreateOrganizationPersonKafkaMessageReplyType[], // Expected response type
            CreateOrganizationPersonKafkaMessageType // Sent message type
          >(
            KafkaTopicEnum.SQF_CREATE_ORGANIZATION_PERSON,
            kafkaMessageForDirectors,
          ),
        );

      const orgPersonDirectorResponse =
        createOrgPersonKafkaResponseForDirector.map((item) => item.data);

      // Prepare data to store Application Person
      const createApplicationPersonForDirectors: CreateApplicationPersonDto = {
        organizationId: application.organizationId,
        applicationId: application.id,
        applicationPersonType: ApplicationPersonTypeEnum.DIRECTOR,
        organizationPersons: orgPersonDirectorResponse,
      };

      // Call service to store Application Person
      await this.applicationPersonService.createNewApplicationPerson(
        createApplicationPersonForDirectors,
      );

      // ------------------------- Directors -------------------------

      // ------------------------- Shareholders -------------------------

      const kafkaMessageForShareholders: CreateOrganizationPersonKafkaMessageType =
        {
          clientPersonaId: application.clientPersonaId,
          organizationId: application.organizationId,
          data: [
            // Map Shareholders
            ...(application.shareholders ?? []).map((shareholder) => ({
              name: shareholder.person.name,
              preferredUsername: null,
              residentialAddress: shareholder.person.residentialAddress,
              identificationNumber: shareholder.person.identificationNumber,
              mobileNumber: shareholder.person.mobileNumber,
              email: shareholder.person.email,
              designation: shareholder.organizationPerson.designation,
            })),
          ],
        };

      // Use kafka to store Organisation Person
      const createOrgPersonKafkaResponseForShareholders: CreateOrganizationPersonKafkaMessageReplyType[] =
        await firstValueFrom(
          this.kafkaProducer.send<
            CreateOrganizationPersonKafkaMessageReplyType[], // Expected response type
            CreateOrganizationPersonKafkaMessageType // Sent message type
          >(
            KafkaTopicEnum.SQF_CREATE_ORGANIZATION_PERSON,
            kafkaMessageForShareholders,
          ),
        );

      const orgPersonShareHolderResponse =
        createOrgPersonKafkaResponseForShareholders.map((item) => item.data);

      // Prepare data to store Application Person
      const createApplicationPersonForShareholders: CreateApplicationPersonDto =
        {
          organizationId: application.organizationId,
          applicationId: application.id,
          applicationPersonType: ApplicationPersonTypeEnum.SHAREHOLDER,
          organizationPersons: orgPersonShareHolderResponse,
        };

      // Call service to store Application Person
      await this.applicationPersonService.createNewApplicationPerson(
        createApplicationPersonForShareholders,
      );

      // ------------------------- Shareholders -------------------------

      // ------------------------- Guarantors -------------------------

      const kafkaMessageForGuarantors: CreateOrganizationPersonKafkaMessageType =
        {
          clientPersonaId: application.clientPersonaId,
          organizationId: application.organizationId,
          data: [
            // Map guarantors
            ...(application.guarantors ?? []).map((guarantor) => ({
              name: guarantor.person.name,
              preferredUsername: null,
              residentialAddress: guarantor.person.residentialAddress,
              identificationNumber: guarantor.person.identificationNumber,
              mobileNumber: guarantor.person.mobileNumber,
              email: guarantor.person.email,
              designation: guarantor.organizationPerson.designation,
            })),
          ],
        };

      // Use kafka to store Organisation Person
      const createOrgPersonKafkaResponseForGuarantors: CreateOrganizationPersonKafkaMessageReplyType[] =
        await firstValueFrom(
          this.kafkaProducer.send<
            CreateOrganizationPersonKafkaMessageReplyType[], // Expected response type
            CreateOrganizationPersonKafkaMessageType // Sent message type
          >(
            KafkaTopicEnum.SQF_CREATE_ORGANIZATION_PERSON,
            kafkaMessageForGuarantors,
          ),
        );

      const orgPersonGuarantorsResponse =
        createOrgPersonKafkaResponseForGuarantors.map((item) => item.data);

      // Prepare data to store Application Person
      const createApplicationPersonForGuarantors: CreateApplicationPersonDto = {
        organizationId: application.organizationId,
        applicationId: application.id,
        applicationPersonType: ApplicationPersonTypeEnum.GUARANTOR,
        organizationPersons: orgPersonGuarantorsResponse,
      };

      // Call service to store Application Person
      await this.applicationPersonService.createNewApplicationPerson(
        createApplicationPersonForGuarantors,
      );

      // ------------------------- Guarantors -------------------------
    } catch (error) {
      console.error(
        'Error saving representative details: ',
        error.message,
        error,
      );

      // Re-throw the HttpException to preserve its status and message
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to store representative details in the database for applicationId: ${application.id}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Representative details updated successfully.',
    };
  }

  async submitApplicationForReview(id: number) {
    // Check if application exists
    const application = await this.applicationRepository.findOne({
      where: {
        id: id,
      },
    });

    // Throw error if application not exists
    if (!application)
      throw new NotFoundException(`Application with id: ${id} not found`);

    const existingScoring = await this.riskApplicationScoringRepository.findOne(
      {
        where: { applicationId: id },
      },
    );

    if (existingScoring) {
      throw new ConflictException(
        `Risk application scoring record already exists for application id: ${id}`,
      );
    }

    // Get the directors with authoriseSignatory = true
    const authorisedSignatories = application.directors?.filter(
      (director) => director.authoriseSignatory === true,
    );

    // Throw error if no authorise signatory
    if (!authorisedSignatories || authorisedSignatories.length === 0) {
      throw new NotFoundException(
        'No authorised signatory found. An authorised signatory must be assigned before proceeding.',
      );
    }

    // Create 3 years of mock financial credit report
    await this.financialCreditReportService.create(application.organizationId);

    try {
      // Hand off to the Risk Agent: status moves to PENDING_ASSIGNEE_REVIEW
      // and an empty RiskApplicationScoring row is created with no
      // riskProfileId. Risk profile selection (previously a deterministic
      // sector/currency/capital-size match done here) and the resulting
      // quantitative Filter 1 scoring/alerts are now performed via
      // change_risk_profile + run_quantitative_scoring, driven by agent
      // judgment, after this method returns (see
      // agents/domain/risk-agent/AGENT.md and apps/risk-agent).
      application.applicationStatus =
        ApplicationStatusEnum.PENDING_ASSIGNEE_REVIEW;

      await this.applicationRepository.save(application);

      const newApplicationScoring = new RiskApplicationScoring({
        applicationId: application.id,
      });

      await this.riskApplicationScoringRepository.save(newApplicationScoring);

      const applicationNumber = application.applicationNumber;

      const queueEventId = uuidv4();
      await this.outboxEventRepository.record(this.entityManager, {
        id: queueEventId,
        topic: KafkaTopicEnum.APPLICATION_SUBMITTED_FOR_REVIEW,
        payload: {
          eventId: queueEventId,
          applicationId: application.id,
          applicationNumber,
          clientPersonaId: application.clientPersonaId,
        },
      });
    } catch (error) {
      console.error('Error updating application status:', error.message, error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to submit application for review for applicationId: ${application.id}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Extract the authorise signatory email address
    // Create a new array emailReceivers containing email addresses of each director who is an authorised signatory
    let emailReceivers = authorisedSignatories.map(
      (director) => director.person.email,
    );

    const signingEmailId = uuidv4();
    await this.outboxEventRepository.record(this.entityManager, {
      id: signingEmailId,
      topic: KafkaTopicEnum.SEND_EMAIL,
      payload: {
        eventId: signingEmailId,
        emailSender: 'notification@sqf.ai',
        emailReceivers,
        emailCc: [],
        emailBcc: [],
        emailReplyTo: [],
        emailSubject: '',
        emailBody: 'Please complete your e-resolution signing.',
      },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Application successfully submitted for review.',
      signatoryEmails: emailReceivers,
    };
  }

  async getLatestApplication(): Promise<Application | null> {
    return await this.applicationRepository
      .createQueryBuilder('application')
      .orderBy('application.id', 'DESC')
      .getOne();
  }

  async getApplicationById(id: number): Promise<Application> {
    const application = await this.applicationRepository.findOne({
      where: { id },
    });
    if (!application) {
      throw new NotFoundException(`Application with id: ${id} not found`);
    }
    return application;
  }

  async getAllApplicationsEvent() {
    try {
      return await this.applicationRepository.find({
        select: [
          'id',
          'organizationId',
          'clientOrganizationName',
          'applicationPersona',
          'applicationStatus',
          'applicationDate',
          'createdAt',
          'updatedAt',
        ],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      console.error(
        'Error fetching applications for getAllApplicationsEvent (SQF_GET_ALL_APPLICATIONS):',
        error,
      );

      return [];
    }
  }

  async getApplicationsbyOrgIdEvent(organizationId: number) {
    try {
      const applications = await this.applicationRepository.find({
        select: [
          'id',
          'organizationId',
          'clientOrganizationName',
          'applicationPersona',
          'applicationNumber',
          'applicationStatus',
          'applicationDate',
          'remark',
          'createdAt',
          'updatedAt',
        ],
        where: { organizationId },
        relations: ['applicationPersons'],
        order: { createdAt: 'DESC' },
      });

      // Fetch organization person details from the API
      const orgPersonResponse = await firstValueFrom(
        this.kafkaProducer.send(
          KafkaTopicEnum.SQF_GET_ORGANIZATION_PERSON_BY_ID,
          organizationId,
        ),
      );

      const orgPersons = orgPersonResponse || [];

      // Transform and map application data with organization person details
      const transformedApplications = applications.map((application) => {
        // Map organization persons to a structure grouped by personId
        const personMap = new Map();

        application.applicationPersons?.forEach((appPerson) => {
          const matchedOrgPerson = orgPersons.find(
            (orgPerson) => orgPerson.id === appPerson.organizationPersonId,
          );

          if (matchedOrgPerson) {
            if (!personMap.has(matchedOrgPerson.personId)) {
              // If the person is not already in the map, add a new entry
              personMap.set(matchedOrgPerson.personId, {
                id: matchedOrgPerson.id,
                organizationPersonId: appPerson.organizationPersonId,
                personId: matchedOrgPerson.personId || null,
                name: matchedOrgPerson.name || null,
                email: matchedOrgPerson.email || null,
                residentialAddress: matchedOrgPerson.residentialAddress || null,
                identificationNumber:
                  matchedOrgPerson.identificationNumber || null,
                mobileNumber: matchedOrgPerson.mobileNumber || null,
                applicationPersonType: appPerson.applicationPersonType,
                designations: [matchedOrgPerson.designation || null],
              });
            } else {
              // If the person already exists in the map, add the designation to the existing array
              const existingPerson = personMap.get(matchedOrgPerson.personId);
              if (
                !existingPerson.designations.includes(
                  matchedOrgPerson.designation, // Avoid duplicate designations
                )
              ) {
                existingPerson.designations.push(matchedOrgPerson.designation); // Add new designation to the array
              }
            }
          }
        });

        return {
          id: application.id,
          organizationId: application.organizationId,
          clientOrganizationName: application.clientOrganizationName,
          applicationPersona: application.applicationPersona,
          applicationNumber: application.applicationNumber,
          applicationStatus: application.applicationStatus,
          applicationDate: application.applicationDate,
          remark: application.remark,
          applicationPersons: Array.from(personMap.values()),
        };
      });

      return transformedApplications;
    } catch (error) {
      console.error(
        `Error fetching applications kafka SQF_GET_ALL_APPLICATIONS for organizationId: ${organizationId}:`,
        error,
      );

      return []; // Return empty array on error
    }
  }
}
