import { CreateClientAssigneeMessage } from '@app/common/apps/customer-relationship-management/types/kafka-message.type';
import { SendEmailMessage } from '@app/common/apps/notification/types/kafka-message.type';
import { ApplicationStatusEnum } from '@app/common/apps/risk-operation/enums/application-status.enum';
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
  CreateOrganizationMessage,
  CreateOrganizationMessageReply,
  UpdateOrganizationByClientPersonaIdMessage,
  UpdateOrganizationMessageReply,
} from '@app/common/apps/trade-directory/types/kafka-message.type';
import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
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
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc, ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ILike } from 'typeorm';
import { Application, ClientAwarderContract } from '../models';
import {
  ApplicationRepository,
  ApplicationSupportingDocumentRepository,
  ClientAwarderContractRepository,
} from '../repositories';
import { AssigneeReviewApplicationEFormBodyDto } from './dtos/assignee-review-application-eform.dto';
import { CreateApplicationBodyDto } from './dtos/create-application.dto';

type GetApplicationsArgs = {
  clientOrganizationName?: string;
  pageSize?: number;
  pageNumber?: number;
  includeClientAwarderContract?: {
    value: boolean;
  };
  includeFacilities?: {
    value: boolean;
  };
};

type GetApplicationByIdArgs = {
  includeClientOrganization?: {
    value: boolean;
  };
  includeClientAwarderContract?: {
    value: boolean;
  };
  includeFactorOrganization?: {
    value: boolean;
  };
  includeCreatorPerson?: {
    value: boolean;
  };
  includeAssigneePerson?: {
    value: boolean;
  };
  includeFacilities?: {
    value: boolean;
  };
  includeApplicationSupportingDocuments?: {
    value: boolean;
  };
};

@Injectable()
export class ApplicationService implements OnModuleInit {
  private organizationService: OrganizationGrpcServiceClient;
  private personService: PersonGrpcServiceClient;
  private readonly GENERAL_FILE_UPLOAD_BUCKET: string;
  private readonly FRONTEND_DOMAIN: string;

  constructor(
    private readonly caslAbilityFactory: CaslAbilityFactory,
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

  getApplications = async ({
    clientOrganizationName,
    pageSize = 50,
    pageNumber = 1,
    includeClientAwarderContract,
    includeFacilities,
  }: GetApplicationsArgs) => {
    const [applications, totalCount] =
      await this.applicationRepository.findAndCount({
        where: {
          clientOrganizationName: clientOrganizationName
            ? ILike(`%${clientOrganizationName}%`)
            : undefined,
        },
        relations: {
          clientAwarderContract: includeClientAwarderContract?.value,
          facilities: includeFacilities?.value,
        },
        order: {
          createdAt: 'ASC',
        },
        take: pageSize,
        skip: (pageNumber - 1) * pageSize,
      });

    return {
      applications,
      pageNumber,
      pageSize,
      currentCount: Math.min(applications.length, pageSize),
      totalCount,
    };
  };

  getMyApplications = async (
    {
      clientOrganizationName,
      pageSize = 50,
      pageNumber = 1,
      includeClientAwarderContract,
      includeFacilities,
    }: GetApplicationsArgs,
    userContext: AuthResponseDto,
  ) => {
    const ability = this.caslAbilityFactory.createForUser(userContext);
    ForbiddenError.from(ability).throwUnlessCan(
      AppActions.Read,
      new Application({
        assigneePersonId: userContext.personId,
      }),
    );

    const [applications, totalCount] =
      await this.applicationRepository.findAndCount({
        where: {
          clientOrganizationName: clientOrganizationName
            ? ILike(`%${clientOrganizationName}%`)
            : undefined,
          assigneePersonId: userContext.personId,
        },
        relations: {
          clientAwarderContract: includeClientAwarderContract?.value,
          facilities: includeFacilities?.value,
        },
        order: {
          createdAt: 'ASC',
        },
        take: pageSize,
        skip: (pageNumber - 1) * pageSize,
      });

    return {
      applications,
      pageNumber,
      pageSize,
      currentCount: Math.min(applications.length, pageSize),
      totalCount,
    };
  };

  getApplicationById = async (
    id: number,
    {
      includeClientOrganization,
      includeClientAwarderContract,
      includeFactorOrganization,
      includeCreatorPerson,
      includeAssigneePerson,
      includeFacilities,
      includeApplicationSupportingDocuments,
    }: GetApplicationByIdArgs,
    userContext: AuthResponseDto,
  ) => {
    const application =
      await this.applicationRepository.findOneOrThrowException({
        where: {
          id,
        },
        relations: {
          clientAwarderContract: includeClientAwarderContract?.value,
          facilities: includeFacilities?.value,
          applicationSupportingDocuments:
            includeApplicationSupportingDocuments?.value,
        },
      });

    const ability = this.caslAbilityFactory.createForUser(userContext);
    ForbiddenError.from(ability).throwUnlessCan(AppActions.Read, application);

    if (includeClientOrganization?.value) {
      const clientPersonaId = application.clientPersonaId;
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
      application.clientOrganization = clientOrganization;
    }
    if (includeFactorOrganization?.value) {
      const factorPersonaId = application.factorPersonaId;
      const {
        organizations: [protoFactorOrganization],
      } = await firstValueFrom(
        this.organizationService.findByFactorPersonaIdGrpc({
          factorPersonaId: [factorPersonaId],
        }),
      );
      const factorOrganization = OrganizationProtoConverter.convertToApp(
        protoFactorOrganization,
      );
      application.factorOrganization = factorOrganization;
    }
    if (includeCreatorPerson?.value) {
      const creatorPersonId = application.creatorPersonId;
      const {
        persons: [protoCreatorPerson],
      } = await firstValueFrom(
        this.personService.findByIdGrpc({
          id: [creatorPersonId],
        }),
      );
      const creatorPerson =
        PersonProtoConverter.convertToApp(protoCreatorPerson);
      application.creatorPerson = creatorPerson;
    }
    if (includeAssigneePerson?.value) {
      const assigneePersonId = application.assigneePersonId;
      const {
        persons: [protoAssigneePerson],
      } = await firstValueFrom(
        this.personService.findByIdGrpc({
          id: [assigneePersonId],
        }),
      );
      const assigneePerson =
        PersonProtoConverter.convertToApp(protoAssigneePerson);
      application.assigneePerson = assigneePerson;
    }
    if (includeApplicationSupportingDocuments?.value) {
      await Promise.all(
        application.applicationSupportingDocuments.map(async (asd) => {
          const downloadUrl = await this.awsS3Service.getDownloadPresignedUrl(
            this.GENERAL_FILE_UPLOAD_BUCKET,
            asd.bucketKey,
          );
          asd.downloadUrl = downloadUrl;
        }),
      );
    }
    return application;
  };

  assignApplication = async (
    applicationId: number,
    assigneePersonId: number,
  ) => {
    const application =
      await this.applicationRepository.findOneOrThrowException({
        where: {
          id: applicationId,
        },
      });

    application.assigneePersonId = assigneePersonId;
    return await this.applicationRepository.save(application);
  };

  createApplication = async (
    args: CreateApplicationBodyDto,
    userContext: AuthResponseDto,
  ) => {
    const clientOrganization = await firstValueFrom(
      this.kafkaProducer.send<
        CreateOrganizationMessageReply,
        CreateOrganizationMessage
      >(KafkaTopicEnum.CREATE_ORGANIZATION, {
        data: args.clientOrganization,
        persona: {
          isClient: true,
          isContractAwarder: false,
          isSupplier: false,
          isFactor: false,
        },
      }),
    );

    this.kafkaProducer.emit<void, CreateClientAssigneeMessage>(
      KafkaTopicEnum.CREATE_CLIENT_ASSIGNEE,
      {
        data: {
          clientPersonaId: clientOrganization.clientPersonaId,
          assigneePersonId: userContext.personId,
        },
      },
    );

    const newApplication = new Application({
      applicationStatus: ApplicationStatusEnum.DRAFT,
      clientPersonaId: clientOrganization.clientPersonaId,
      clientOrganizationName: args.clientOrganization.organizationName,
      clientContactPersons: args.clientContactPersons.map((cp) => ({
        person: cp.person,
        organizationPerson: cp.organizationPerson,
      })),
      clientAwarderContract: new ClientAwarderContract({
        clientPersonaId: clientOrganization.clientPersonaId,
        clientOrganizationName: args.clientOrganization.organizationName,
        contractAwarder: {
          organization: args.clientAwarderContract.contractAwarder.organization,
          personInCharge: undefined,
          keyManagementPersonnel: undefined,
        },
      }),
      factorPersonaId: userContext.factorPersonaId,
      creatorPersonId: userContext.personId,
      assigneePersonId: userContext.personId,
    });

    return await this.applicationRepository.save(newApplication);
  };

  assigneeReviewApplicationEForm = async (
    applicationId: number,
    args: AssigneeReviewApplicationEFormBodyDto,
    userContext: AuthResponseDto,
  ) => {
    const application =
      await this.applicationRepository.findOneOrThrowException({
        where: {
          id: applicationId,
        },
        relations: {
          applicationPublics: true,
        },
      });

    const ability = this.caslAbilityFactory.createForUser(userContext);
    ForbiddenError.from(ability).throwUnlessCan(AppActions.Update, application);

    if (
      application.applicationStatus !==
      ApplicationStatusEnum.PENDING_ASSIGNEE_REVIEW
    ) {
      throw new BadRequestException(
        `Application is not in ${ApplicationStatusEnum.PENDING_ASSIGNEE_REVIEW} status`,
      );
    }

    const applicationSupportingDocuments =
      await this.applicationSupportingDocumentRepository.find({
        where: {
          applicationId: application.id,
        },
      });

    applicationSupportingDocuments.forEach((asd) => {
      asd.isActive = false;
      asd.isVerified = false;
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
      applicationSupportingDocument.isVerified = asd.isVerified;
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
      applicationStatus: ApplicationStatusEnum.PENDING_RISK_FILTER_1,
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

    const emailReceivers = application.clientContactPersons.map(
      (ccp) => ccp.person.email,
    );

    const applicationPublic = application.applicationPublics.reduce(
      (acc, ap) => {
        if (!acc) {
          return ap;
        }
        if (ap.expiryDateTime > acc.expiryDateTime) {
          return ap;
        }
        return acc;
      },
      null,
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
          applicationLink: `${this.FRONTEND_DOMAIN}/application-summary/${applicationPublic.uuid}`,
        },
      },
    });
  };
}
