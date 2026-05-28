import { ExperianReportSourceEnum } from '@app/common/apps/trade-directory/enums/experian-report-source.enum';
import { ExperianReportStatusEnum } from '@app/common/apps/trade-directory/enums/experian-report-status.enum';
import {
  ExperianReportTypeEnum,
  ExperianReportTypeEnumHelper,
} from '@app/common/apps/trade-directory/enums/experian-report-type.enum';
import { OrganizationMalaysiaRegionEnum } from '@app/common/apps/trade-directory/enums/organization-malaysia-region.enum';
import { OrganizationTypeEnumHelper } from '@app/common/apps/trade-directory/enums/organization-type.enum';
import {
  ReceiveExperianReportMessage,
  RequestExperianReportMessage,
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
import { In } from 'typeorm';
import { Experian } from '../models';
import { ExperianRepository, OrganizationRepository } from '../repositories';
import { IXmlBuilder, IXmlParser } from './experian.parser';

type RequestExperianReportArgs = {
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

export type RequestCIExperianReportArgs = RequestExperianReportArgs;
export type RequestBIExperianReportArgs = RequestExperianReportArgs & {
  isFromEastMalaysia: boolean;
};

@Injectable()
export class ExperianService {
  private readonly logger = new Logger(ExperianService.name);
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
    private readonly experianRepository: ExperianRepository,
    private readonly httpService: HttpService,
  ) {}

  requestExperianReport = async (args: RequestExperianReportMessage) => {
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
        !ExperianReportTypeEnumHelper.CompanyIntelligence().includes(
          args.experianReportType,
        )
      ) {
        this.logger.error(
          `Organization with id ${args.organizationId} is a company, but requested report type is not company intelligence`,
        );
        return;
      }

      await this.requestCIExperianReport({
        organizationId: args.organizationId,
        enhancedReport:
          args.experianReportType ===
          ExperianReportTypeEnum.ENHANCED_COMPANY_INTELLIGENCE,
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
        !ExperianReportTypeEnumHelper.BusinessIntelligence().includes(
          args.experianReportType,
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

      await this.requestBIExperianReport({
        organizationId: args.organizationId,
        enhancedReport:
          args.experianReportType ===
          ExperianReportTypeEnum.ENHANCED_BUSINESS_INTELLIGENCE,
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
  };

  requestCIExperianReport = async (args: RequestCIExperianReportArgs) => {
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

    const experianReport = new Experian({
      organizationId: args.organizationId,
      reportType: args.enhancedReport
        ? ExperianReportTypeEnum.ENHANCED_COMPANY_INTELLIGENCE
        : ExperianReportTypeEnum.COMPANY_INTELLIGENCE,
      reportStatus: ExperianReportStatusEnum.PENDING,
      reportSource: ExperianReportSourceEnum.API,
      token1,
      token2,
    });

    await this.experianRepository.save(experianReport);
  };

  requestBIExperianReport = async (args: RequestBIExperianReportArgs) => {
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

    const experianReport = new Experian({
      organizationId: args.organizationId,
      reportType: args.enhancedReport
        ? ExperianReportTypeEnum.ENHANCED_BUSINESS_INTELLIGENCE
        : ExperianReportTypeEnum.BUSINESS_INTELLIGENCE,
      reportStatus: ExperianReportStatusEnum.PENDING,
      reportSource: ExperianReportSourceEnum.API,
      token1,
      token2,
    });

    await this.experianRepository.save(experianReport);
  };

  getExperians = async (clientPersonaId: number) => {
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
          experianReports: true, // Load related Experian reports for the organization
        },
      });

      // Filter the experianReports to include only the specified types
      if (organization.experianReports.length > 0) {
        organization.experianReports = organization.experianReports.filter(
          (report) =>
            [
              'ENHANCED_COMPANY_INTELLIGENCE',
              'ENHANCED_BUSINESS_INTELLIGENCE',
            ].includes(report.reportType),
        );
      }

      // Throw an error if no reports match the specified types after filtering
      if (organization.experianReports.length === 0) {
        throw new NotFoundException(
          `Experian reports not found for the given clientPersonaId: ${clientPersonaId}`,
        );
      }

      // Iterate over each Experian report associated with the organization
      for (const experian of organization.experianReports) {
        // --------------- Commented out: XML parser-related logic --------------
        //   let parser: IXmlParser;
        //   if (
        //     ExperianReportTypeEnumHelper.BusinessIntelligence().includes(
        //       experian.reportType,
        //     )
        //   ) {
        //     parser = this.biXmlParser;
        //   }
        //   if (
        //     ExperianReportTypeEnumHelper.CompanyIntelligence().includes(
        //       experian.reportType,
        //     )
        //   ) {
        //     parser = this.ciXmlParser;
        //   }
        //   if (!parser) {
        //     this.logger.error(
        //       `No parser found for report type: ${experian.reportType}, organizationId: ${experian.organizationId}`,
        //     );
        //     continue;
        //   }

        //   const parsedReport = parser.parse(experian.xml);
        //   experian.xmlJson = parsedReport;

        // Clear sensitive tokens to avoid exposing them further
        experian.token1 = undefined;
        experian.token2 = undefined;
      }

      // Return the list of processed Experian reports
      return {
        statusCode: HttpStatus.OK,
        message: 'Successfully fetched experian report',
        data: organization.experianReports[0],
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
        'Failed to fetch experian report from database',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  };

  @Cron(CronExpression.EVERY_5_MINUTES)
  async tryRetrievePendingExperianReportCron() {
    const logger = new Logger(
      Experian.name + '-tryRetrievePendingExperianReportCron',
    );

    const startDateTime = new Date();
    logger.log(
      `-tryRetrievePendingExperianReportCron started at: ${startDateTime.toISOString()}`,
    );

    const pendingExperianReports = await this.experianRepository.find({
      where: {
        reportType: In([
          ...ExperianReportTypeEnumHelper.BusinessIntelligence(),
          ...ExperianReportTypeEnumHelper.CompanyIntelligence(),
        ]),
        reportStatus: ExperianReportStatusEnum.PENDING,
        reportSource: ExperianReportSourceEnum.API,
      },
    });

    for (const pendingExperianReport of pendingExperianReports) {
      const retrieveReportReqBody = this.defaultXmlBuilder.build({
        xml: {
          request: {
            token1: pendingExperianReport.token1,
            token2: pendingExperianReport.token2,
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

      pendingExperianReport.xml = retrieveReportRes.data;
      pendingExperianReport.reportStatus = ExperianReportStatusEnum.SUCCESS;

      await this.experianRepository.save(pendingExperianReport);
      let parser: IXmlParser;
      if (
        ExperianReportTypeEnumHelper.BusinessIntelligence().includes(
          pendingExperianReport.reportType,
        )
      ) {
        parser = this.biXmlParser;
      }
      if (
        ExperianReportTypeEnumHelper.CompanyIntelligence().includes(
          pendingExperianReport.reportType,
        )
      ) {
        parser = this.ciXmlParser;
      }
      if (!parser) {
        logger.error(
          `No parser found for report type: ${pendingExperianReport.reportType}, organizationId: ${pendingExperianReport.organizationId}`,
        );
        continue;
      }

      const parsedReport = parser.parse(pendingExperianReport.xml);
      pendingExperianReport.xmlJson = parsedReport;
      this.kafkaProducer.emit<void, ReceiveExperianReportMessage>(
        KafkaTopicEnum.RECEIVE_EXPERIAN_REPORT,
        pendingExperianReport,
      );
    }

    const endDateTime = new Date();
    logger.log(
      `-tryRetrievePendingExperianReportCron ended at: ${endDateTime.toISOString()}, elapsed: ${differenceInMilliseconds(
        endDateTime,
        startDateTime,
      )}ms`,
    );
  }
}
