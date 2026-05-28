import { Module } from '@nestjs/common';
import { RiskQuantitativeThresholdRuleService } from './risk-quantitative-threshold-rule.service';
import { RiskQuantitativeThresholdRuleController } from './risk-quantitative-threshold-rule.controller';
import { RiskQuantitativeThresholdRuleRepository } from '../../repositories/risk-quantitative-threshold-rule.repository';
import { DatabaseModule } from '@app/common/database/database.module';
import { RiskQuantitativeThresholdRule } from '../../models/risk-quantitative-threshold-rule.entity';
import { RiskProfile } from '../../models/risk-profile.entity';
import { RiskProfileRepository } from '../../repositories/risk-profile.repository';
import { RiskQuantitativeParameterService } from '../risk-quantitative-parameter/risk-quantitative-parameter.service';
import { RiskQuantitativeParameter } from '../../models/risk-quantitative-parameter.entity';
import { RiskQuantitativeSubParameter } from '../../models/risk-quantitative-sub-parameter.entity';
import { RiskQuantitativeParameterRepository } from '../../repositories/risk-quantitative-parameter.repository';
import { RiskQuantitativeProfileWeight } from '../../models/risk-quantitative-profile-weight.entity';
import { RiskQuantitativeProfileWeightService } from '../risk-quantitative-profile-weight/risk-quantitative-profile-weight.service';
import { RiskQuantitativeProfileWeightRepository } from '../../repositories/risk-quantitative-profile-weight.repository';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([
      RiskQuantitativeThresholdRule,
      RiskProfile,
      RiskQuantitativeParameter,
      RiskQuantitativeSubParameter,
      RiskQuantitativeProfileWeight,
    ]),
  ],
  controllers: [RiskQuantitativeThresholdRuleController],
  providers: [
    RiskQuantitativeThresholdRuleService,
    RiskQuantitativeThresholdRuleRepository,
    RiskProfileRepository,
    RiskQuantitativeParameterService,
    RiskQuantitativeParameterRepository,
    RiskQuantitativeProfileWeightService,
    RiskQuantitativeProfileWeightRepository,
  ],
})
export class RiskQuantitativeThresholdRuleModule {}
