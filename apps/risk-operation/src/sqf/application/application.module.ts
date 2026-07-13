import { Module } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { ApplicationRepository } from '../../repositories';
import { ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@app/common/database/database.module';
import { Application, ApplicationPerson } from '../../models';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TRADE_SERVICE } from '@app/common/constants/services';
import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import path from 'path';
import { HttpModule } from '@nestjs/axios';
import { ApplicationPersonService } from '../application-person/application-person.service';
import { ApplicationPersonRepository } from '../../repositories/application-person.repository';
import { RiskApplicationScoring } from '../../models/risk-application-scoring.entity';
import { RiskApplicationScoringRepository } from '../../repositories/risk-application-scoring.repository';
import { RiskProfile } from '../../models/risk-profile.entity';
import { RiskProfileRepository } from '../../repositories/risk-profile.repository';
import { RiskQuantitativeProfileScoring } from '../../models/risk-quantitative-profile-scoring.entity';
import { RiskQuantitativeProfileScoringService } from '../risk-quantitative-profile-scoring/risk-quantitative-profile-scoring.service';
import { RiskQuantitativeProfileScoringRepository } from '../../repositories/risk-quantitative-profile-scoring.repository';
import { RiskManualReviewAlertService } from '../risk-manual-review-alert/risk-manual-review-alert.service';
import { RiskManualReviewAlertRepository } from '../../repositories/risk-manual-review-alert.repository';
import { RiskManualReviewAlert } from '../../models/risk-manual-review-alert.entity';
import { FinancialCreditReportRepository } from '../../repositories/financial-credit-report.repository';
import { FinancialCreditReport } from '../../models/financial-credit-report.entity';
import { FinancialCreditReportService } from '../financial-credit-report/financial-credit-report.service';
import { S3Client } from '@aws-sdk/client-s3';
import { RiskProfileService } from '../risk-profile/risk-profile.service';
import { RiskQuantitativeProfileWeight } from '../../models/risk-quantitative-profile-weight.entity';
import { RiskQuantitativeProfileWeightRepository } from '../../repositories/risk-quantitative-profile-weight.repository';
import { RiskQuantitativeProfileWeightService } from '../risk-quantitative-profile-weight/risk-quantitative-profile-weight.service';
import { RiskQuantitativeThresholdRuleRepository } from '../../repositories/risk-quantitative-threshold-rule.repository';
import { RiskQuantitativeThresholdRule } from '../../models/risk-quantitative-threshold-rule.entity';
import { RiskQuantitativeThresholdRuleService } from '../risk-quantitative-threshold-rule/risk-quantitative-threshold-rule.service';
import { RiskQuantitativeParameterRepository } from '../../repositories/risk-quantitative-parameter.repository';
import { RiskQuantitativeParameterService } from '../risk-quantitative-parameter/risk-quantitative-parameter.service';
import { RiskQuantitativeParameter } from '../../models/risk-quantitative-parameter.entity';
import { RiskApplicationAuditLog } from '../../models/risk-application-audit-log.entity';
import { RiskApplicationAuditLogService } from '../risk-application-audit-log/risk-application-audit-log.service';
import { RiskApplicationAuditLogRepository } from '../../repositories/risk-application-audit-log.repository';
import { OutboxEvent } from '@app/common/database/outbox-event.entity';
import { OutboxEventRepository } from '../../repositories/outbox-event.repository';
import { OutboxRelayService } from '../../outbox/outbox-relay.service';

@Module({
  imports: [
    DatabaseModule.forFeature([
      Application,
      ApplicationPerson,
      RiskApplicationScoring,
      RiskProfile,
      RiskQuantitativeProfileScoring,
      RiskManualReviewAlert,
      FinancialCreditReport,
      RiskQuantitativeProfileWeight,
      RiskQuantitativeThresholdRule,
      RiskQuantitativeParameter,
      RiskApplicationAuditLog,
      OutboxEvent,
    ]),
    HttpModule, // Import HttpModule for HttpService
    ClientsModule.registerAsync([
      {
        name: DependencyInjectionTokenEnum.KAFKA_PRODUCER,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'risk-operation',
              brokers: configService
                .getOrThrow<string>('KAFKA_BROKERS')
                .split(','),
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [ApplicationController],
  providers: [
    ApplicationService,
    ApplicationRepository,
    ApplicationPersonService,
    ApplicationPersonRepository,
    RiskApplicationScoringRepository,
    RiskProfileRepository,
    RiskProfileService,
    RiskQuantitativeProfileScoringService,
    RiskQuantitativeProfileScoringRepository,
    RiskManualReviewAlertService,
    RiskManualReviewAlertRepository,
    FinancialCreditReportService,
    FinancialCreditReportRepository,
    RiskQuantitativeProfileWeightRepository,
    RiskQuantitativeProfileWeightService,
    RiskQuantitativeThresholdRuleService,
    RiskQuantitativeThresholdRuleRepository,
    RiskQuantitativeParameterService,
    RiskQuantitativeParameterRepository,
    RiskApplicationAuditLogService,
    RiskApplicationAuditLogRepository,
    OutboxEventRepository,
    OutboxRelayService,
    {
      provide: 'S3Client',
      useFactory: (configService: ConfigService) => {
        const region = configService.get('AWS_S3_REGION');
        const accessKeyId = configService.get('AWS_ACCESS_KEY_ID');
        const secretAccessKey = configService.get('AWS_SECRET_ACCESS_KEY');

        return new S3Client({
          region,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
      },
      inject: [ConfigService],
    },
  ],
})
export class SqfApplicationModule {}
