import { Module } from '@nestjs/common';
import { RiskHighClassificationScoringService } from './risk-high-classification-scoring.service';
import { RiskHighClassificationScoringController } from './risk-high-classification-scoring.controller';
import { DatabaseModule } from '@app/common/database/database.module';
import { Application } from '../../models/application.entity';
import { ApplicationRepository } from '../../repositories/application.repository';
import { RiskApplicationScoringRepository } from '../../repositories/risk-application-scoring.repository';
import { RiskApplicationScoring } from '../../models/risk-application-scoring.entity';
import { RiskHighClassificationScoring } from '../../models/risk-high-classification-scoring.entity';
import { RiskHighClassificationScoringRepository } from '../../repositories/risk-high-classification-scoring.repository';
import { RiskHighClassificationFactorRepository } from '../../repositories/risk-high-classification-factor.repository';
import { RiskHighClassificationFactor } from '../../models/risk-high-classification-factor.entity';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([
      Application,
      RiskApplicationScoring,
      RiskHighClassificationScoring,
      RiskHighClassificationFactor,
    ]),
  ],
  controllers: [RiskHighClassificationScoringController],
  providers: [
    RiskHighClassificationScoringService,
    ApplicationRepository,
    RiskApplicationScoringRepository,
    RiskHighClassificationScoringRepository,
    RiskHighClassificationFactorRepository,
  ],
})
export class RiskHighClassificationScoringModule {}
