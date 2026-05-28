import { Module } from '@nestjs/common';
import { RiskQuantitativeProfileWeightService } from './risk-quantitative-profile-weight.service';
import { RiskQuantitativeProfileWeightController } from './risk-quantitative-profile-weight.controller';
import { DatabaseModule } from '@app/common/database/database.module';
import { RiskQuantitativeProfileWeightRepository } from '../../repositories/risk-quantitative-profile-weight.repository';
import { RiskQuantitativeProfileWeight } from '../../models/risk-quantitative-profile-weight.entity';
import { RiskQuantitativeParameterService } from '../risk-quantitative-parameter/risk-quantitative-parameter.service';
import { RiskQuantitativeParameter } from '../../models/risk-quantitative-parameter.entity';
import { RiskQuantitativeParameterRepository } from '../../repositories/risk-quantitative-parameter.repository';
import { RiskProfile } from '../../models/risk-profile.entity';
import { RiskProfileRepository } from '../../repositories/risk-profile.repository';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([
      RiskQuantitativeProfileWeight,
      RiskQuantitativeParameter,
      RiskProfile,
    ]),
  ],
  controllers: [RiskQuantitativeProfileWeightController],
  providers: [
    RiskQuantitativeProfileWeightService,
    RiskQuantitativeProfileWeightRepository,
    RiskQuantitativeParameterService,
    RiskQuantitativeParameterRepository,
    RiskProfileRepository,
  ],
})
export class RiskQuantitativeProfileWeightModule {}
