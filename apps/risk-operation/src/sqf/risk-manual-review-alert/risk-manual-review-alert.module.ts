import { Module } from '@nestjs/common';
import { RiskManualReviewAlertService } from './risk-manual-review-alert.service';
import { RiskManualReviewAlertController } from './risk-manual-review-alert.controller';
import { RiskManualReviewAlert } from '../../models/risk-manual-review-alert.entity';
import { RiskManualReviewAlertRepository } from '../../repositories/risk-manual-review-alert.repository';
import { DatabaseModule } from '@app/common/database/database.module';
import { ApplicationRepository } from '../../repositories/application.repository';
import { Application } from '../../models/application.entity';
import { FinancialCreditReport } from '../../models/financial-credit-report.entity';
import { FinancialCreditReportService } from '../financial-credit-report/financial-credit-report.service';
import { FinancialCreditReportRepository } from '../../repositories/financial-credit-report.repository';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { RiskQuantitativeThresholdRuleRepository } from '../../repositories/risk-quantitative-threshold-rule.repository';
import { RiskQuantitativeThresholdRuleService } from '../risk-quantitative-threshold-rule/risk-quantitative-threshold-rule.service';
import { RiskQuantitativeThresholdRule } from '../../models/risk-quantitative-threshold-rule.entity';
import { RiskProfileService } from '../risk-profile/risk-profile.service';
import { RiskProfile } from '../../models/risk-profile.entity';
import { RiskProfileRepository } from '../../repositories/risk-profile.repository';
import { RiskQuantitativeParameterRepository } from '../../repositories/risk-quantitative-parameter.repository';
import { RiskQuantitativeParameterService } from '../risk-quantitative-parameter/risk-quantitative-parameter.service';
import { RiskQuantitativeParameter } from '../../models/risk-quantitative-parameter.entity';
import { RiskQuantitativeProfileWeightRepository } from '../../repositories/risk-quantitative-profile-weight.repository';
import { RiskQuantitativeProfileWeightService } from '../risk-quantitative-profile-weight/risk-quantitative-profile-weight.service';
import { RiskQuantitativeProfileWeight } from '../../models/risk-quantitative-profile-weight.entity';
import { RiskApplicationAuditLogRepository } from '../../repositories/risk-application-audit-log.repository';
import { RiskApplicationAuditLog } from '../../models/risk-application-audit-log.entity';
import { RiskApplicationAuditLogService } from '../risk-application-audit-log/risk-application-audit-log.service';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([
      RiskManualReviewAlert,
      Application,
      FinancialCreditReport,
      RiskQuantitativeThresholdRule,
      RiskProfile,
      RiskQuantitativeParameter,
      RiskQuantitativeProfileWeight,
      RiskApplicationAuditLog,
    ]),
  ],
  controllers: [RiskManualReviewAlertController],
  providers: [
    RiskManualReviewAlertService,
    RiskManualReviewAlertRepository,
    ApplicationRepository,
    FinancialCreditReportService,
    FinancialCreditReportRepository,
    RiskQuantitativeThresholdRuleService,
    RiskQuantitativeThresholdRuleRepository,
    RiskProfileService,
    RiskProfileRepository,
    RiskQuantitativeParameterService,
    RiskQuantitativeParameterRepository,
    RiskQuantitativeProfileWeightService,
    RiskQuantitativeProfileWeightRepository,
    RiskApplicationAuditLogService,
    RiskApplicationAuditLogRepository,
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
export class RiskManualReviewAlertModule {}
