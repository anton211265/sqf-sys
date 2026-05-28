import { SendEmailMessage } from '@app/common/apps/notification/types/kafka-message.type';
import { ApplicationStatusEnum } from '@app/common/apps/risk-operation/enums/application-status.enum';
import { ExperianReportTypeEnum } from '@app/common/apps/trade-directory/enums/experian-report-type.enum';
import { OrganizationTypeEnumHelper } from '@app/common/apps/trade-directory/enums/organization-type.enum';
import {
  OrganizationProtoConverter,
  PersonProtoConverter,
} from '@app/common/apps/trade-directory/proto-converter';
import {
  ORGANIZATION_GRPC_SERVICE_NAME,
  OrganizationGrpcServiceClient,
} from '@app/common/apps/trade-directory/proto/organization';
import {
  PERSON_GRPC_SERVICE_NAME,
  PersonGrpcServiceClient,
} from '@app/common/apps/trade-directory/proto/person';
import {
  ReceiveExperianReportMessage,
  RequestExperianReportMessage,
  UpdateOrganizationByClientPersonaIdMessage,
  UpdateOrganizationMessageReply,
} from '@app/common/apps/trade-directory/types/kafka-message.type';
import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { ApplicationPublicGuardResponseDto } from '@app/common/guards/application-public/dtos/application-public-guard-response.dto';
import { AuthResponseDto } from '@app/common/guards/auth/dtos/auth-response.dto';
import { AwsS3Service } from '@app/common/modules/aws-s3/aws-s3.service';
import {
  AppActions,
  CaslAbilityFactory,
} from '@app/common/modules/casl/casl-ability.factory';
import { ForbiddenError } from '@casl/ability';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc, ClientKafka } from '@nestjs/microservices';
import { isUUID } from 'class-validator';
import { addDays } from 'date-fns';
import { firstValueFrom } from 'rxjs';
import { z } from 'zod';
import {
  Application,
  ApplicationPublic,
  ApplicationSupportingDocument,
  ClientAwarderContract,
} from '../models';
import {
  ApplicationPublicRepository,
  ApplicationRepository,
  ApplicationSupportingDocumentRepository,
  ClientAwarderContractRepository,
} from '../repositories';
import { ClientSubmitApplicationEFormBodyDto } from './dtos/client-submit-application-eform.dto';
import { GrantExperianConsentBodyDto } from './dtos/grant-experian-consent.dto';

@Injectable()
export class ApplicationPublicService {
  private readonly logger = new Logger(ApplicationPublicService.name);
  private organizationService: OrganizationGrpcServiceClient;
  private personService: PersonGrpcServiceClient;
  private readonly GENERAL_FILE_UPLOAD_BUCKET: string;
  private readonly FRONTEND_DOMAIN: string;

  constructor(
    private readonly caslAbilityFactory: CaslAbilityFactory,
    private readonly applicationPublicRepository: ApplicationPublicRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly clientAwarderContractRepository: ClientAwarderContractRepository,
    private readonly applicationSupportingDocumentRepository: ApplicationSupportingDocumentRepository,
    @Inject(DependencyInjectionTokenEnum.TRADE_DIRECTORY_GRPC_CLIENT)
    private readonly tradeDirectoryGrpcClient: ClientGrpc,
    @Inject(DependencyInjectionTokenEnum.KAFKA_PRODUCER)
    private readonly kafkaProducer: ClientKafka,
    private readonly awsS3Service: AwsS3Service,
    private readonly configService: ConfigService,
  ) {
    this.GENERAL_FILE_UPLOAD_BUCKET = this.configService.getOrThrow(
      'GENERAL_FILE_UPLOAD_BUCKET',
    );
    this.FRONTEND_DOMAIN = this.configService.getOrThrow('FRONTEND_DOMAIN');
  }

  onModuleInit() {
    this.organizationService =
      this.tradeDirectoryGrpcClient.getService<OrganizationGrpcServiceClient>(
        ORGANIZATION_GRPC_SERVICE_NAME,
      );
    this.personService =
      this.tradeDirectoryGrpcClient.getService<PersonGrpcServiceClient>(
        PERSON_GRPC_SERVICE_NAME,
      );
  }

  validate = async (
    applicationPublicUuid: string,
  ): Promise<ApplicationPublicGuardResponseDto> => {
    if (!isUUID(applicationPublicUuid)) {
      this.logger.warn('applicationPublicUuid is not a valid UUID');
      throw new NotFoundException('Invalid applicationPublicUuid');
    }

    const applicationPublic = await this.applicationPublicRepository.findOne({
      where: { uuid: applicationPublicUuid },
      relations: {
        application: {
          clientAwarderContract: true,
        },
      },
    });

    if (!applicationPublic) {
      this.logger.warn('ApplicationPublic record not found in database');
      throw new NotFoundException('Invalid applicationPublicUuid');
    }

    const now = new Date();
    if (applicationPublic.expiryDateTime < now) {
      this.logger.warn('ApplicationPublic record has expired');
      throw new NotFoundException('Invalid applicationPublicUuid');
    }

    const clientPersonaId = applicationPublic.application.clientPersonaId;

    const {
      organizations: [protoClientOrganization],
    } = await firstValueFrom(
      this.organizationService.findByClientPersonaIdGrpc({
        clientPersonaId: [clientPersonaId],
      }),
    );

    const clientOrganization = OrganizationProtoConverter.convertToApp(
      protoClientOrganization,
    );

    applicationPublic.application.clientOrganization = clientOrganization;

    const applicationPublicContext: ApplicationPublicGuardResponseDto = {
      applicationPublicId: applicationPublic.id,
      applicationId: applicationPublic.applicationId,
      clientPersonaId: applicationPublic.application.clientPersonaId,
      application: applicationPublic.application,
    };

    return applicationPublicContext;
  };

  requestClientConsent = async (
    applicationId: number,
    userContext: AuthResponseDto,
  ) => {
    let application = await this.applicationRepository.findOneOrThrowException({
      where: {
        id: applicationId,
      },
    });

    const ability = this.caslAbilityFactory.createForUser(userContext);
    ForbiddenError.from(ability).throwUnlessCan(AppActions.Update, application);

    if (application.applicationStatus !== ApplicationStatusEnum.DRAFT) {
      throw new BadRequestException(
        `Application is not in ${ApplicationStatusEnum.DRAFT} status`,
      );
    }

    const clientContactPersonsValidator = z.any().array().min(1);
    const clientContactPersonsValidation =
      clientContactPersonsValidator.safeParse(application.clientContactPersons);
    if (clientContactPersonsValidation.success === false) {
      this.logger.error(
        `ClientContactPersons is invalid, ApplicationId: ${application.id}`,
      );

      throw new InternalServerErrorException();
    }

    const newApplicationPublicArgs: Required<ApplicationPublic> = {
      id: undefined,
      uuid: crypto.randomUUID(),
      expiryDateTime: addDays(new Date(), 3),
      applicationId: application.id,
      application: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    };

    let applicationPublic = new ApplicationPublic(newApplicationPublicArgs);

    applicationPublic =
      await this.applicationPublicRepository.save(applicationPublic);

    const emailReceivers = application.clientContactPersons.map(
      (ccp) => ccp.person.email,
    );

    this.kafkaProducer.emit<void, SendEmailMessage>(KafkaTopicEnum.SEND_EMAIL, {
      emailSender: userContext.email,
      emailReceivers,
      emailCc: [],
      emailBcc: [],
      emailReplyTo: [],
      emailSubject: 'STEP 1: REGISTER YOUR APPLICATION WITH EL NUWR',
      emailTemplate: {
        templateName: '/application-client-invite.pug',
        templateVariables: {
          applicationLink: `${this.FRONTEND_DOMAIN}/consent-form/${applicationPublic.uuid}`,
        },
      },
    });

    application.applicationStatus =
      ApplicationStatusEnum.PENDING_EXPERIAN_CONSENT;
    application = await this.applicationRepository.save(application);
  };

  grantExperianConsent = async (
    consent: GrantExperianConsentBodyDto,
    applicationPublicContext: ApplicationPublicGuardResponseDto,
  ) => {
    if (!consent.granted) {
      throw new BadRequestException('Consent not granted');
    }

    if (!consent.mobileNumber && !consent.emailAddress) {
      throw new Error('Either mobile number or email address is required');
    }

    let application = await this.applicationRepository.findOneOrThrowException({
      where: {
        id: applicationPublicContext.applicationId,
      },
    });

    if (
      application.applicationStatus !==
      ApplicationStatusEnum.PENDING_EXPERIAN_CONSENT
    ) {
      throw new BadRequestException(
        `Application is not in ${ApplicationStatusEnum.PENDING_EXPERIAN_CONSENT} status`,
      );
    }

    const {
      organizations: [protoClientOrganization],
    } = await firstValueFrom(
      this.organizationService.findByClientPersonaIdGrpc({
        clientPersonaId: [application.clientPersonaId],
      }),
    );

    const clientOrganization = OrganizationProtoConverter.convertToApp(
      protoClientOrganization,
    );

    let experianReportType: ExperianReportTypeEnum;
    if (
      OrganizationTypeEnumHelper.CompanyType().includes(
        clientOrganization.organizationType,
      )
    ) {
      experianReportType = ExperianReportTypeEnum.ENHANCED_COMPANY_INTELLIGENCE;
    }

    if (
      OrganizationTypeEnumHelper.BusinessType().includes(
        clientOrganization.organizationType,
      )
    ) {
      experianReportType =
        ExperianReportTypeEnum.ENHANCED_BUSINESS_INTELLIGENCE;
    }

    if (!experianReportType) {
      this.logger.error(
        `Organization type not supported for Experian report, OrganizationId: ${clientOrganization.id}`,
      );
      throw new InternalServerErrorException();
    }

    this.kafkaProducer.emit<void, RequestExperianReportMessage>(
      KafkaTopicEnum.REQUEST_EXPERIAN_REPORT,
      {
        organizationId: clientOrganization.id,
        consent: {
          granted: consent.granted,
          emailAddress: consent.emailAddress,
          mobileNumber: consent.mobileNumber,
        },
        experianReportType,
      },
    );

    application.applicationStatus =
      ApplicationStatusEnum.PENDING_EXPERIAN_REPORT;
    application = await this.applicationRepository.save(application);
  };

  onReceiveExperianReport = async (args: ReceiveExperianReportMessage) => {
    const {
      organizations: [protoOrganization],
    } = await firstValueFrom(
      this.organizationService.findByIdGrpc({
        id: [args.organizationId],
      }),
    );

    const organization =
      OrganizationProtoConverter.convertToApp(protoOrganization);

    let application = await this.applicationRepository.findOne({
      where: {
        clientPersonaId: organization.clientPersonaId,
        applicationStatus: ApplicationStatusEnum.PENDING_EXPERIAN_REPORT,
      },
      relations: {
        applicationPublics: true,
      },
    });

    if (!application) {
      this.logger.log(
        `Received Kafka event: ${KafkaTopicEnum.RECEIVE_EXPERIAN_REPORT}, but no application found with clientPersonaId: ${organization.clientPersonaId}, skipping...`,
      );
      return;
    }

    const {
      persons: [protoAssigneePerson],
    } = await firstValueFrom(
      this.personService.findByIdGrpc({
        id: [application.assigneePersonId],
      }),
    );

    const assigneePerson =
      PersonProtoConverter.convertToApp(protoAssigneePerson);

    const clientContactPersonsValidator = z.any().array().min(1);
    const clientContactPersonsValidation =
      clientContactPersonsValidator.safeParse(application.clientContactPersons);
    if (clientContactPersonsValidation.success === false) {
      this.logger.error(
        `ClientContactPersons is invalid, ApplicationId: ${application.id}`,
      );
    }

    const applicationPublic = application.applicationPublics.find(
      (ap) => ap.expiryDateTime > new Date(),
    );

    if (!applicationPublic) {
      this.logger.error(
        `ApplicationPublic with valid expiryDateTime not found, ApplicationId: ${application.id}`,
      );
    }

    const emailReceivers = application.clientContactPersons.map(
      (ccp) => ccp.person.email,
    );

    this.kafkaProducer.emit<void, SendEmailMessage>(KafkaTopicEnum.SEND_EMAIL, {
      emailSender: assigneePerson.email,
      emailReceivers,
      emailCc: [],
      emailBcc: [],
      emailReplyTo: [],
      emailSubject: 'STEP 1: REGISTER YOUR APPLICATION WITH EL NUWR',
      emailTemplate: {
        templateName: '/application-client-invite.pug',
        templateVariables: {
          applicationLink: `${this.FRONTEND_DOMAIN}/client-application/${applicationPublic.uuid}`,
        },
      },
    });
    application.applicationStatus =
      ApplicationStatusEnum.PENDING_CLIENT_SUBMISSION;
    application = await this.applicationRepository.save(application);
  };

  presignedUploadApplicationSupportingDocument = async (
    applicationPublicContext: ApplicationPublicGuardResponseDto,
  ) => {
    const application =
      await this.applicationRepository.findOneOrThrowException({
        where: {
          id: applicationPublicContext.applicationId,
        },
        relations: {
          applicationSupportingDocuments: true,
        },
      });

    const directory = 'application-supporting-document';
    const bucketKey = `${directory}/${crypto.randomUUID()}`;
    const uploadUrl = await this.awsS3Service.getUploadPresignedUrl(
      this.GENERAL_FILE_UPLOAD_BUCKET,
      bucketKey,
    );

    application.applicationSupportingDocuments.push(
      new ApplicationSupportingDocument({
        bucketKey,
        isActive: false,
      }),
    );
    await this.applicationRepository.save(application);

    const downloadUrl = await this.awsS3Service.getDownloadPresignedUrl(
      this.GENERAL_FILE_UPLOAD_BUCKET,
      bucketKey,
    );

    return { bucketKey, uploadUrl, downloadUrl };
  };

  clientSubmitApplicationEForm = async (
    args: ClientSubmitApplicationEFormBodyDto,
    applicationPublicContext: ApplicationPublicGuardResponseDto,
  ) => {
    const application =
      await this.applicationRepository.findOneOrThrowException({
        where: {
          id: applicationPublicContext.applicationId,
        },
      });

    if (
      application.applicationStatus !==
      ApplicationStatusEnum.PENDING_CLIENT_SUBMISSION
    ) {
      throw new BadRequestException(
        `Application is not in ${ApplicationStatusEnum.PENDING_CLIENT_SUBMISSION} status`,
      );
    }

    const applicationSupportingDocuments =
      await this.applicationSupportingDocumentRepository.find({
        where: {
          applicationId: application.id,
        },
      });

    args.applicationSupportingDocuments.forEach((asd) => {
      const applicationSupportingDocument = applicationSupportingDocuments.find(
        (a) => a.bucketKey === asd.bucketKey,
      );

      if (!applicationSupportingDocument) {
        throw new BadRequestException(
          `ApplicationSupportingDocument not found, BucketKey: ${asd.bucketKey}`,
        );
      }
      applicationSupportingDocument.isActive = true;
    });

    const clientOrganization = await firstValueFrom(
      this.kafkaProducer.send<
        UpdateOrganizationMessageReply,
        UpdateOrganizationByClientPersonaIdMessage
      >(KafkaTopicEnum.UPDATE_ORGANIZATION, {
        clientPersonaId: application.clientPersonaId,
        data: args.clientOrganization,
      }),
    );

    const updateClientAwarderContractArgs: Required<ClientAwarderContract> = {
      id: undefined,
      contractTitle: args.clientAwarderContract.contractTitle,
      contractNumber: args.clientAwarderContract.contractNumber,
      contractType: args.clientAwarderContract.contractType,
      contractTypeOther: args.clientAwarderContract.contractTypeOther,
      contractNature: args.clientAwarderContract.contractNature,
      contractStatus: args.clientAwarderContract.contractStatus,
      assignmentMethod: args.clientAwarderContract.assignmentMethod,
      fundingChannel: args.clientAwarderContract.fundingChannel,
      collectionMethod: args.clientAwarderContract.collectionMethod,
      contractStartDate: args.clientAwarderContract.contractStartDate,
      contractEndDate: args.clientAwarderContract.contractEndDate,
      extensionOfTenure: args.clientAwarderContract.extensionOfTenure,
      contractSigningDate: args.clientAwarderContract.contractSigningDate,
      totalContractValue: args.clientAwarderContract.totalContractValue,
      totalContractValueClaimed:
        args.clientAwarderContract.totalContractValueClaimed,
      totalContractValueCurrency:
        args.clientAwarderContract.totalContractValueCurrency,
      variationOrders: args.clientAwarderContract.variationOrders.map((vo) => ({
        variationOrderStartDate: vo.variationOrderStartDate,
        variationOrderEndDate: vo.variationOrderEndDate,
        variationOrderValue: vo.variationOrderValue,
        variationOrderCurrency: vo.variationOrderCurrency,
      })),
      remark: args.clientAwarderContract.remark,
      applications: undefined,
      clientPersonaId: application.clientPersonaId,
      clientOrganization: undefined,
      clientOrganizationName: args.clientOrganization.organizationName,
      contractAwarder: {
        organization: args.clientAwarderContract.contractAwarder.organization,
        personInCharge:
          args.clientAwarderContract.contractAwarder.personInCharge.map(
            (pic) => ({
              person: pic.person,
              organizationPerson: pic.organizationPerson,
            }),
          ),
        keyManagementPersonnel:
          args.clientAwarderContract.contractAwarder.keyManagementPersonnel.map(
            (kmp) => ({
              person: kmp.person,
              organizationPerson: kmp.organizationPerson,
            }),
          ),
      },
      suppliers: args.clientAwarderContract.suppliers.map((supplier) => ({
        organization: supplier.organization,
        personInCharge: supplier.personInCharge.map((pic) => ({
          person: pic.person,
          organizationPerson: pic.organizationPerson,
        })),
      })),
      createdAt: undefined,
      updatedAt: undefined,
    };

    const updateApplicationArgs: Required<Application> = {
      id: undefined,
      applicationStatus: ApplicationStatusEnum.PENDING_ASSIGNEE_REVIEW,
      applicationDate: undefined,
      organizationId: undefined,
      applicationPersona: undefined,
      applicationNumber: undefined,
      applicationPersons: undefined,
      riskApplicationScoring: undefined,
      leadSource: args.leadSource,
      clientPersonaId: undefined,
      clientOrganization: undefined,
      clientOrganizationName: args.clientOrganization.organizationName,
      clientContactPersons: undefined,
      clientBankAccounts: args.clientBankAccounts.map((cba) => ({
        bankAccount: cba.bankAccount,
        preferred: cba.preferred,
        escrow: cba.escrow,
      })),
      clientPersonInCharge: args.clientPersonInCharge.map((cpic) => ({
        person: cpic.person,
        organizationPerson: cpic.organizationPerson,
      })),
      clientAwarderContract: undefined,
      clientAwarderContractId: undefined,
      directors: args.directors.map((d) => ({
        person: d.person,
        organizationPerson: d.organizationPerson,
      })),
      nextOfKins: args.nextOfKins.map((nok) => ({
        person: nok.person,
        organizationPerson: nok.organizationPerson,
      })),
      corporateGuarantors: args.corporateGuarantors.map((cg) => ({
        organization: cg.organization,
      })),
      remark: args.remark,
      numberOfContractSecured: args.numberOfContractSecured,
      valueOfContractSecured: args.valueOfContractSecured,
      valueOfContractSecuredCurrency: args.valueOfContractSecuredCurrency,
      applicationFee: undefined,
      latePaymentCharges: undefined,
      administrationFee: undefined,
      processingFee: undefined,
      remittanceCharges: undefined,
      collectionFee: undefined,
      eMandateFee: undefined,
      facilityFee: undefined,
      supportLetterCharges: undefined,
      letterOfUndertakingCharges: undefined,
      bankGuaranteeServiceFee: undefined,
      letterOfCreditServiceFee: undefined,
      customerRetention: undefined,
      financialAdvisory: undefined,
      retainerFee: undefined,
      arrangerFee: undefined,
      stampingFee: undefined,
      sinkingFund: undefined,
      approvalFee: undefined,
      factorPersonaId: undefined,
      factorOrganization: undefined,
      creatorPersonId: undefined,
      creatorPerson: undefined,
      assigneePersonId: undefined,
      assigneePerson: undefined,
      facilities: undefined,
      applicationSupportingDocuments: undefined,
      applicationPublics: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      shareholders: [],
      guarantors: []
    };

    await this.applicationRepository.update(
      { id: application.id },
      updateApplicationArgs,
    );

    await this.clientAwarderContractRepository.update(
      { id: application.clientAwarderContractId },
      updateClientAwarderContractArgs,
    );

    await this.applicationSupportingDocumentRepository.saveMany(
      applicationSupportingDocuments,
    );
  };

  createApplicationPublic = async (
    applicationId: number,
    userContext: AuthResponseDto,
  ) => {
    const application =
      await this.applicationRepository.findOneOrThrowException({
        where: {
          id: applicationId,
        },
      });

    const ability = this.caslAbilityFactory.createForUser(userContext);
    ForbiddenError.from(ability).throwUnlessCan(AppActions.Update, application);

    const newApplicationPublicArgs: Required<ApplicationPublic> = {
      id: undefined,
      uuid: crypto.randomUUID(),
      expiryDateTime: addDays(new Date(), 3),
      applicationId: application.id,
      application: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    };

    let applicationPublic = new ApplicationPublic(newApplicationPublicArgs);

    applicationPublic =
      await this.applicationPublicRepository.save(applicationPublic);

    const emailReceivers = application.clientContactPersons.map(
      (ccp) => ccp.person.email,
    );

    this.kafkaProducer.emit<void, SendEmailMessage>(KafkaTopicEnum.SEND_EMAIL, {
      emailSender: userContext.email,
      emailReceivers,
      emailCc: [],
      emailBcc: [],
      emailReplyTo: [],
      emailSubject: 'STEP 1: REGISTER YOUR APPLICATION WITH EL NUWR',
      emailTemplate: {
        templateName: '/application-client-invite.pug',
        templateVariables: {
          applicationLink: `${this.FRONTEND_DOMAIN}/client-application/${applicationPublic.uuid}`,
        },
      },
    });

    await this.applicationPublicRepository.save(applicationPublic);
  };
}
