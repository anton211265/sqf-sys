import { KycReportSourceEnum } from '@app/common/apps/trade-directory/enums/kyc-report-source.enum';
import { KycReportStatusEnum } from '@app/common/apps/trade-directory/enums/kyc-report-status.enum';
import {
  KycReportTypeEnum,
  KycReportTypeEnumHelper,
} from '@app/common/apps/trade-directory/enums/kyc-report-type.enum';
import { OrganizationMalaysiaRegionEnum } from '@app/common/apps/trade-directory/enums/organization-malaysia-region.enum';
import { OrganizationTypeEnumHelper } from '@app/common/apps/trade-directory/enums/organization-type.enum';
import {
  ReceiveKycReportMessage,
  RequestKycReportMessage,
} from '@app/common/apps/trade-directory/types/kafka-message.type';
import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import { differenceInMilliseconds } from 'date-fns';
import { firstValueFrom } from 'rxjs';
import { EntityManager, In } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { KycAgencyReport } from '../models';
import {
  KycAgencyReportRepository,
  OrganizationRepository,
  OutboxEventRepository,
  ProcessedEventRepository,
} from '../repositories';
import { IXmlBuilder, IXmlParser } from './kyc-agency.parser';

type RequestKycReportArgs = {
  organizationId: number;
  enhancedReport: boolean;
  entityName: string;
  entityId: string;
  entityId2?: string;
  consent: {
    granted: boolean;
    mobileNumber?: string;
    emailAddress?: string;
  };
};

export type RequestCIKycReportArgs = RequestKycReportArgs;
export type RequestBIKycReportArgs = RequestKycReportArgs & {
  isFromEastMalaysia: boolean;
};

@Injectable()
export class KycAgencyService {
  private readonly logger = new Logger(KycAgencyService.name);
  private readonly xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>\n';
  constructor(
    @Inject(DependencyInjectionTokenEnum.DEFAULT_XML_BUILDER)
    private readonly defaultXmlBuilder: IXmlBuilder,
    @Inject(DependencyInjectionTokenEnum.DEFAULT_XML_PARSER)
    private readonly defaultXmlParser: IXmlParser,
    @Inject(DependencyInjectionTokenEnum.CI_XML_PARSER)
    private readonly ciXmlParser: IXmlParser,
    @Inject(DependencyInjectionTokenEnum.BI_XML_PARSER)
    private readonly biXmlParser: IXmlParser,
    @Inject(DependencyInjectionTokenEnum.KAFKA_PRODUCER)
    private readonly kafkaProducer: ClientKafka,
    private readonly organizationRepository: OrganizationRepository,
    private readonly kycAgencyReportRepository: KycAgencyReportRepository,
    private readonly httpService: HttpService,
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly processedEventRepository: ProcessedEventRepository,
    private readonly entityManager: EntityManager,
  ) {}

  requestKycReport = async (args: RequestKycReportMessage) => {
    if (await this.processedEventRepository.exists(args.eventId)) {
      this.logger.warn(
        `Skipping already-processed REQUEST_KYC_REPORT event: ${args.eventId}`,
      );
      return;
    }

    const organization = await this.organizationRepository.findOne({
      where: {
        id: args.organizationId,
      },
    });

    if (!organization) {
      this.logger.error(
        `Organization with id ${args.organizationId} not found`,
      );
      return;
    }

    if (
      OrganizationTypeEnumHelper.CompanyType().includes(
        organization.organizationType,
      )
    ) {
      if (
        !KycReportTypeEnumHelper.CompanyIntelligence().includes(
          args.kycReportType,
        )
      ) {
        this.logger.error(
          `Organization with id ${args.organizationId} is a company, but requested report type is not company intelligence`,
        );
        return;
      }

      await this.requestCIKycReport({
        organizationId: args.organizationId,
        enhancedReport:
          args.kycReportType ===
          KycReportTypeEnum.ENHANCED_COMPANY_INTELLIGENCE,
        entityName: organization.organizationName,
        entityId: organization.businessRegistrationNumber,
        consent: {
          granted: args.consent.granted,
          mobileNumber: args.consent.mobileNumber,
          emailAddress: args.consent.emailAddress,
        },
      });
    }

    if (
      OrganizationTypeEnumHelper.BusinessType().includes(
        organization.organizationType,
      )
    ) {
      if (
        !KycReportTypeEnumHelper.BusinessIntelligence().includes(
          args.kycReportType,
        )
      ) {
        this.logger.error(
          `Organization with id ${args.organizationId} is a business, but requested report type is not business intelligence`,
        );
        return;
      }

      if (!organization.malaysiaRegion) {
        this.logger.error(
          `Organization with id ${args.organizationId} has no malaysiaRegion value`,
        );
        return;
      }

      const isNotMalaysia =
        organization.malaysiaRegion === OrganizationMalaysiaRegionEnum.OTHER;
      if (isNotMalaysia) {
        this.logger.error(
          `Organization with id ${args.organizationId} is not from Malaysia`,
        );
        return;
      }

      await this.requestBIKycReport({
        organizationId: args.organizationId,
        enhancedReport:
          args.kycReportType ===
          KycReportTypeEnum.ENHANCED_BUSINESS_INTELLIGENCE,
        entityName: organization.organizationName,
        entityId: organization.businessRegistrationNumber,
        consent: {
          granted: args.consent.granted,
          mobileNumber: args.consent.mobileNumber,
          emailAddress: args.consent.emailAddress,
        },
        isFromEastMalaysia:
          organization.malaysiaRegion ===
          OrganizationMalaysiaRegionEnum.EAST_MALAYSIA,
      });
    }

    await this.entityManager.transaction(async (manager) => {
      await this.processedEventRepository.record(manager, {
        id: args.eventId,
        topic: KafkaTopicEnum.REQUEST_KYC_REPORT,
      });
    });
  };

  requestCIKycReport = async (args: RequestCIKycReportArgs) => {
    if (!args.consent.granted) {
      throw new Error('Consent must be granted');
    }

    if (!args.consent.mobileNumber && !args.consent.emailAddress) {
      throw new Error('Either mobile number or email address is required');
    }

    const productType = args.enhancedReport ? 'ECI' : 'CI';
    const requestReportReqBody = this.defaultXmlBuilder.build({
      xml: {
        request: {
          ProductType: productType,
          EntityName: args.entityName,
          EntityId: args.entityId,
          EntityId2: args.entityId2,
          MobileNo: args.consent.mobileNumber,
          EmailAddress: args.consent.emailAddress,
          ConsentGranted: args.consent.granted ? 'Y' : 'N',
          EnquiryPurpose: 'NEW APPLICATION',
        },
      },
    });
    const requestReportReqBodyWithDeclaration = `${this.xmlDeclaration}${requestReportReqBody}`;

    let requestReportRes;
    try {
      requestReportRes = await firstValueFrom(
        this.httpService.post<string>(
          'index.php/sapm/report',
          requestReportReqBodyWithDeclaration,
        ),
      );
    } catch (error) {}

    const {
      xml: { token1, token2 },
    } = this.defaultXmlParser.parse<{
      xml: {
        token1: string;
        token2: string;
      };
    }>(requestReportRes.data);

    const kycReport = new KycAgencyReport({
      organizationId: args.organizationId,
      reportType: args.enhancedReport
        ? KycReportTypeEnum.ENHANCED_COMPANY_INTELLIGENCE
        : KycReportTypeEnum.COMPANY_INTELLIGENCE,
      reportStatus: KycReportStatusEnum.PENDING,
      reportSource: KycReportSourceEnum.API,
      token1,
      token2,
    });

    await this.kycAgencyReportRepository.save(kycReport);
  };

  requestBIKycReport = async (args: RequestBIKycReportArgs) => {
    if (!args.consent.granted) {
      throw new Error('Consent must be granted');
    }

    if (!args.consent.mobileNumber && !args.consent.emailAddress) {
      throw new Error('Either mobile number or email address is required');
    }

    const productType = args.enhancedReport ? 'EBI' : 'BI';
    const requestReportReqBody = this.defaultXmlBuilder.build({
      xml: {
        request: {
          ProductType: productType,
          EntityName: args.entityName,
          EntityId: args.entityId,
          EntityId2: args.entityId2,
          MobileNo: args.consent.mobileNumber,
          EmailAddress: args.consent.emailAddress,
          ConsentGranted: args.consent.granted ? 'Y' : 'N',
          EnquiryPurpose: 'NEW APPLICATION',
          EastMalaysia: args.isFromEastMalaysia ? 'Y' : 'N',
        },
      },
    });
    const requestReportReqBodyWithDeclaration = `${this.xmlDeclaration}${requestReportReqBody}`;

    const requestReportRes = await firstValueFrom(
      this.httpService.post<string>(
        'index.php/sapm/report',
        requestReportReqBodyWithDeclaration,
      ),
    );

    const {
      xml: { token1, token2 },
    } = this.defaultXmlParser.parse<{
      xml: {
        token1: string;
        token2: string;
      };
    }>(requestReportRes.data);

    const kycReport = new KycAgencyReport({
      organizationId: args.organizationId,
      reportType: args.enhancedReport
        ? KycReportTypeEnum.ENHANCED_BUSINESS_INTELLIGENCE
        : KycReportTypeEnum.BUSINESS_INTELLIGENCE,
      reportStatus: KycReportStatusEnum.PENDING,
      reportSource: KycReportSourceEnum.API,
      token1,
      token2,
    });

    await this.kycAgencyReportRepository.save(kycReport);
  };

  getKycAgencyReports = async (clientPersonaId: number) => {
    try {
      // Check if clientPersonaId is provided in the query parameters
      if (!clientPersonaId) {
        throw new BadRequestException('clientPersonaId is required');
      }

      // Query the organization from the database by clientPersonaId
      const organization = await this.organizationRepository.findOne({
        where: {
          clientPersonaId,
        },
        relations: {
          kycAgencyReports: true, // Load related KYC agency reports for the organization
        },
      });

      // Filter the kycAgencyReports to include only the specified types
      if (organization.kycAgencyReports.length > 0) {
        organization.kycAgencyReports = organization.kycAgencyReports.filter(
          (report) =>
            [
              'ENHANCED_COMPANY_INTELLIGENCE',
              'ENHANCED_BUSINESS_INTELLIGENCE',
            ].includes(report.reportType),
        );
      }

      // Throw an error if no reports match the specified types after filtering
      if (organization.kycAgencyReports.length === 0) {
        throw new NotFoundException(
          `KYC agency reports not found for the given clientPersonaId: ${clientPersonaId}`,
        );
      }

      // Iterate over each KYC agency report associated with the organization
      for (const kycReport of organization.kycAgencyReports) {
        // --------------- Commented out: XML parser-related logic --------------
        //   let parser: IXmlParser;
        //   if (
        //     KycReportTypeEnumHelper.BusinessIntelligence().includes(
        //       kycReport.reportType,
        //     )
        //   ) {
        //     parser = this.biXmlParser;
        //   }
        //   if (
        //     KycReportTypeEnumHelper.CompanyIntelligence().includes(
        //       kycReport.reportType,
        //     )
        //   ) {
        //     parser = this.ciXmlParser;
        //   }
        //   if (!parser) {
        //     this.logger.error(
        //       `No parser found for report type: ${kycReport.reportType}, organizationId: ${kycReport.organizationId}`,
        //     );
        //     continue;
        //   }

        //   const parsedReport = parser.parse(kycReport.xml);
        //   kycReport.xmlJson = parsedReport;

        // Clear sensitive tokens to avoid exposing them further
        kycReport.token1 = undefined;
        kycReport.token2 = undefined;
      }

      // Return the list of processed KYC agency reports
      return {
        statusCode: HttpStatus.OK,
        message: 'Successfully fetched KYC agency report',
        data: organization.kycAgencyReports[0],
      };
    } catch (error) {
      // Rethrow known exceptions (BadRequestException, NotFoundException)
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      // Handle any other unexpected errors
      throw new HttpException(
        'Failed to fetch KYC agency report from database',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  };

  @Cron(CronExpression.EVERY_5_MINUTES)
  async tryRetrievePendingKycReportCron() {
    const logger = new Logger(
      KycAgencyReport.name + '-tryRetrievePendingKycReportCron',
    );

    const startDateTime = new Date();
    logger.log(
      `-tryRetrievePendingKycReportCron started at: ${startDateTime.toISOString()}`,
    );

    const pendingKycReports = await this.kycAgencyReportRepository.find({
      where: {
        reportType: In([
          ...KycReportTypeEnumHelper.BusinessIntelligence(),
          ...KycReportTypeEnumHelper.CompanyIntelligence(),
        ]),
        reportStatus: KycReportStatusEnum.PENDING,
        reportSource: KycReportSourceEnum.API,
      },
    });

    for (const pendingKycReport of pendingKycReports) {
      const retrieveReportReqBody = this.defaultXmlBuilder.build({
        xml: {
          request: {
            token1: pendingKycReport.token1,
            token2: pendingKycReport.token2,
          },
        },
      });

      const retrieveReportReqBodyWithDeclaration = `${this.xmlDeclaration}${retrieveReportReqBody}`;
      const retrieveReportRes = await firstValueFrom(
        this.httpService.post(
          'index.php/sapm/xml',
          retrieveReportReqBodyWithDeclaration,
        ),
      );

      pendingKycReport.xml = retrieveReportRes.data;
      pendingKycReport.reportStatus = KycReportStatusEnum.SUCCESS;

      await this.kycAgencyReportRepository.save(pendingKycReport);
      let parser: IXmlParser;
      if (
        KycReportTypeEnumHelper.BusinessIntelligence().includes(
          pendingKycReport.reportType,
        )
      ) {
        parser = this.biXmlParser;
      }
      if (
        KycReportTypeEnumHelper.CompanyIntelligence().includes(
          pendingKycReport.reportType,
        )
      ) {
        parser = this.ciXmlParser;
      }
      if (!parser) {
        logger.error(
          `No parser found for report type: ${pendingKycReport.reportType}, organizationId: ${pendingKycReport.organizationId}`,
        );
        continue;
      }

      const parsedReport = parser.parse(pendingKycReport.xml);
      pendingKycReport.xmlJson = parsedReport;
      const receiveEventId = uuid();
      await this.entityManager.transaction(async (manager) => {
        await manager.save(KycAgencyReport, pendingKycReport);
        await this.outboxEventRepository.record(manager, {
          id: receiveEventId,
          topic: KafkaTopicEnum.RECEIVE_KYC_REPORT,
          payload: { ...pendingKycReport, eventId: receiveEventId } as unknown as Record<string, unknown>,
        });
      });
    }

    const endDateTime = new Date();
    logger.log(
      `-tryRetrievePendingKycReportCron ended at: ${endDateTime.toISOString()}, elapsed: ${differenceInMilliseconds(
        endDateTime,
        startDateTime,
      )}ms`,
    );
  }
}
