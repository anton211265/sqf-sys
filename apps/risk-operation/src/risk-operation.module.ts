import { DatabaseModule } from '@app/common/database/database.module';
import { LoggerModule } from '@app/common/logger/logger.module';
import { CaslModule } from '@app/common/modules/casl/casl.module';
import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { z } from 'zod';
import {
  Application,
  ApplicationPerson,
  ApplicationSupportingDocument,
} from './models';
import { ApplicationRepository } from './repositories';
import { OutboxEvent } from '@app/common/database/outbox-event.entity';
import { ProcessedEvent } from '@app/common/database/processed-event.entity';
import { SqfApplicationModule } from './sqf/application/application.module';
import { ApplicationPersonModule } from './sqf/application-person/application-person.module';
import { RiskModelModule } from './sqf/risk-model/risk-model.module';
import { RiskModelRepository } from './repositories/risk-model.repository';
import { RiskModel } from './models/risk-model.entity';
import { RiskEvaluationParameter } from './models/risk-evaluation-parameter.entity';
import { RiskApplicationScoring } from './models/risk-application-scoring.entity';
import { RiskFactorScoring } from './models/risk-factor-scoring.entity';
import { RiskHighClassificationScoring } from './models/risk-high-classification-scoring.entity';
import { RiskFactorModule } from './sqf/risk-factor/risk-factor.module';
import { RiskEvaluationParameterModule } from './sqf/risk-evaluation-parameter/risk-evaluation-parameter.module';
import { RiskHighClassificationFactorModule } from './sqf/risk-high-classification-factor/risk-high-classification-factor.module';
import { RiskApplicationScoringModule } from './sqf/risk-application-scoring/risk-application-scoring.module';
import { RiskHighClassificationScoringModule } from './sqf/risk-high-classification-scoring/risk-high-classification-scoring.module';
import { RiskFactorScoringModule } from './sqf/risk-factor-scoring/risk-factor-scoring.module';
import { FinancialCreditReport } from './models/financial-credit-report.entity';
import { RiskProfile } from './models/risk-profile.entity';
import { RiskQuantitativeProfileWeight } from './models/risk-quantitative-profile-weight.entity';
import { RiskQuantitativeParameter } from './models/risk-quantitative-parameter.entity';
import { RiskQuantitativeSubParameter } from './models/risk-quantitative-sub-parameter.entity';
import { RiskQuantitativeThresholdRule } from './models/risk-quantitative-threshold-rule.entity';
import { RiskQuantitativeProfileScoring } from './models/risk-quantitative-profile-scoring.entity';
import { RiskApplicationAuditLog } from './models/risk-application-audit-log.entity';
import { RiskManualReviewAlert } from './models/risk-manual-review-alert.entity';
import { FinancialCreditReportModule } from './sqf/financial-credit-report/financial-credit-report.module';
import { RiskQuantitativeProfileScoringModule } from './sqf/risk-quantitative-profile-scoring/risk-quantitative-profile-scoring.module';
import { RiskProfileModule } from './sqf/risk-profile/risk-profile.module';
import { RiskQuantitativeProfileWeightModule } from './sqf/risk-quantitative-profile-weight/risk-quantitative-profile-weight.module';
import { RiskQuantitativeParameterModule } from './sqf/risk-quantitative-parameter/risk-quantitative-parameter.module';
import { RiskQuantitativeThresholdRuleModule } from './sqf/risk-quantitative-threshold-rule/risk-quantitative-threshold-rule.module';
import { RiskApplicationAuditLogModule } from './sqf/risk-application-audit-log/risk-application-audit-log.module';
import { RiskManualReviewAlertModule } from './sqf/risk-manual-review-alert/risk-manual-review-alert.module';
@Module({
  imports: [
    CaslModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    DatabaseModule,
    DatabaseModule.forFeature([
      Application,
      ApplicationPerson,
      ApplicationSupportingDocument,
      RiskModel,
      RiskEvaluationParameter,
      RiskApplicationScoring,
      RiskFactorScoring,
      RiskHighClassificationScoring,
      FinancialCreditReport,
      RiskProfile,
      RiskQuantitativeProfileWeight,
      RiskQuantitativeParameter,
      RiskQuantitativeSubParameter,
      RiskQuantitativeThresholdRule,
      RiskQuantitativeProfileScoring,
      RiskApplicationAuditLog,
      RiskManualReviewAlert,
      OutboxEvent,
      ProcessedEvent,
    ]),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validate(config) {
        return z
          .object({
            ROOT_DIR: z.string(),
            PORT: z.coerce.number(),
            KAFKA_BROKERS: z.string(),
            TRADE_DIRECTORY_URL: z.string(),
            GENERAL_FILE_UPLOAD_BUCKET: z.string(),
            FRONTEND_DOMAIN: z.string(),
          })
          .parse(config);
      },
    }),

    LoggerModule,

    // ----------------------SQF----------------------
    SqfApplicationModule,
    ApplicationPersonModule,
    RiskModelModule,
    RiskFactorModule,
    RiskEvaluationParameterModule,
    RiskHighClassificationFactorModule,
    RiskApplicationScoringModule,
    RiskHighClassificationScoringModule,
    RiskFactorScoringModule,
    FinancialCreditReportModule,
    RiskQuantitativeProfileScoringModule,
    RiskProfileModule,
    RiskQuantitativeProfileWeightModule,
    RiskQuantitativeParameterModule,
    RiskQuantitativeThresholdRuleModule,
    RiskApplicationAuditLogModule,
    RiskManualReviewAlertModule,
    // ----------------------SQF----------------------
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    ApplicationRepository,
    RiskModelRepository,
  ],
})
export class RiskOperationModule {}
