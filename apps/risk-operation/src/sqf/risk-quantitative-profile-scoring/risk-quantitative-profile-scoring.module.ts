import { Module } from '@nestjs/common';
import { RiskQuantitativeProfileScoringService } from './risk-quantitative-profile-scoring.service';
import { RiskQuantitativeProfileScoringController } from './risk-quantitative-profile-scoring.controller';
import { DatabaseModule } from '@app/common/database/database.module';
import { RiskQuantitativeProfileScoring } from '../../models/risk-quantitative-profile-scoring.entity';
import { RiskQuantitativeProfileScoringRepository } from '../../repositories/risk-quantitative-profile-scoring.repository';
import { Application } from '../../models/application.entity';
import { ApplicationRepository } from '../../repositories/application.repository';
import { RiskApplicationScoringRepository } from '../../repositories/risk-application-scoring.repository';
import { RiskApplicationScoring } from '../../models/risk-application-scoring.entity';
import { FinancialCreditReportRepository } from '../../repositories/financial-credit-report.repository';
import { FinancialCreditReportService } from '../financial-credit-report/financial-credit-report.service';
import { FinancialCreditReport } from '../../models/financial-credit-report.entity';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { RiskProfileRepository } from '../../repositories/risk-profile.repository';
import { RiskProfileService } from '../risk-profile/risk-profile.service';
import { RiskProfile } from '../../models/risk-profile.entity';
import { RiskQuantitativeProfileWeight } from '../../models/risk-quantitative-profile-weight.entity';
import { RiskQuantitativeProfileWeightRepository } from '../../repositories/risk-quantitative-profile-weight.repository';
import { RiskQuantitativeProfileWeightService } from '../risk-quantitative-profile-weight/risk-quantitative-profile-weight.service';
import { RiskQuantitativeThresholdRuleService } from '../risk-quantitative-threshold-rule/risk-quantitative-threshold-rule.service';
import { RiskQuantitativeThresholdRuleRepository } from '../../repositories/risk-quantitative-threshold-rule.repository';
import { RiskQuantitativeThresholdRule } from '../../models/risk-quantitative-threshold-rule.entity';
import { RiskQuantitativeParameterRepository } from '../../repositories/risk-quantitative-parameter.repository';
import { RiskQuantitativeParameterService } from '../risk-quantitative-parameter/risk-quantitative-parameter.service';
import { RiskQuantitativeParameter } from '../../models/risk-quantitative-parameter.entity';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([
      RiskQuantitativeProfileScoring,
      Application,
      RiskApplicationScoring,
      FinancialCreditReport,
      RiskProfile,
      RiskQuantitativeProfileWeight,
      RiskQuantitativeThresholdRule,
      RiskQuantitativeParameter,
    ]),
  ],
  controllers: [RiskQuantitativeProfileScoringController],
  providers: [
    RiskQuantitativeProfileScoringService,
    RiskQuantitativeProfileScoringRepository,
    ApplicationRepository,
    RiskApplicationScoringRepository,
    FinancialCreditReportService,
    FinancialCreditReportRepository,
    RiskProfileService,
    RiskProfileRepository,
    RiskQuantitativeProfileWeightRepository,
    RiskQuantitativeProfileWeightService,
    RiskQuantitativeThresholdRuleService,
    RiskQuantitativeThresholdRuleRepository,
    RiskQuantitativeParameterService,
    RiskQuantitativeParameterRepository,
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
export class RiskQuantitativeProfileScoringModule {}
