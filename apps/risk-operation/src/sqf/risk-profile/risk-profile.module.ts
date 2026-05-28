import { Module } from '@nestjs/common';
import { RiskProfileService } from './risk-profile.service';
import { RiskProfileController } from './risk-profile.controller';
import { RiskProfile } from '../../models/risk-profile.entity';
import { DatabaseModule } from '@app/common/database/database.module';
import { RiskProfileRepository } from '../../repositories/risk-profile.repository';
import { RiskQuantitativeProfileWeightRepository } from '../../repositories/risk-quantitative-profile-weight.repository';
import { RiskQuantitativeProfileWeight } from '../../models/risk-quantitative-profile-weight.entity';
import { RiskQuantitativeProfileWeightService } from '../risk-quantitative-profile-weight/risk-quantitative-profile-weight.service';
import { RiskQuantitativeThresholdRuleService } from '../risk-quantitative-threshold-rule/risk-quantitative-threshold-rule.service';
import { RiskQuantitativeThresholdRule } from '../../models/risk-quantitative-threshold-rule.entity';
import { RiskQuantitativeThresholdRuleRepository } from '../../repositories/risk-quantitative-threshold-rule.repository';
import { RiskQuantitativeParameterService } from '../risk-quantitative-parameter/risk-quantitative-parameter.service';
import { RiskQuantitativeParameter } from '../../models/risk-quantitative-parameter.entity';
import { RiskQuantitativeParameterRepository } from '../../repositories/risk-quantitative-parameter.repository';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([
      RiskProfile,
      RiskQuantitativeProfileWeight,
      RiskQuantitativeThresholdRule,
      RiskQuantitativeParameter,
    ]),
  ],
  controllers: [RiskProfileController],
  providers: [
    RiskProfileService,
    RiskProfileRepository,
    RiskQuantitativeProfileWeightRepository,
    RiskQuantitativeProfileWeightService,
    RiskQuantitativeThresholdRuleService,
    RiskQuantitativeThresholdRuleRepository,
    RiskQuantitativeParameterService,
    RiskQuantitativeParameterRepository,
  ],
})
export class RiskProfileModule {}
