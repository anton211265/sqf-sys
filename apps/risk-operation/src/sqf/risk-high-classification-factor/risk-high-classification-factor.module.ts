import { Module } from '@nestjs/common';
import { RiskHighClassificationFactorService } from './risk-high-classification-factor.service';
import { RiskHighClassificationFactorController } from './risk-high-classification-factor.controller';
import { RiskModelRepository } from '../../repositories/risk-model.repository';
import { DatabaseModule } from '@app/common/database/database.module';
import { RiskModel } from '../../models/risk-model.entity';
import { RiskHighClassificationFactor } from '../../models/risk-high-classification-factor.entity';
import { RiskHighClassificationFactorRepository } from '../../repositories/risk-high-classification-factor.repository';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([RiskHighClassificationFactor, RiskModel]),
  ],
  controllers: [RiskHighClassificationFactorController],
  providers: [
    RiskHighClassificationFactorService,
    RiskModelRepository,
    RiskHighClassificationFactorRepository,
  ],
})
export class RiskHighClassificationFactorModule {}
