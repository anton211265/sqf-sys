import { Module } from '@nestjs/common';
import { RiskFactorScoringService } from './risk-factor-scoring.service';
import { RiskFactorScoringController } from './risk-factor-scoring.controller';
import { DatabaseModule } from '@app/common/database/database.module';
import { RiskFactorScoring } from '../../models/risk-factor-scoring.entity';
import { RiskFactorScoringRepository } from '../../repositories/risk-factor-scoring.repository';
import { Application } from '../../models/application.entity';
import { ApplicationRepository } from '../../repositories/application.repository';
import { RiskModel } from '../../models/risk-model.entity';
import { RiskModelRepository } from '../../repositories/risk-model.repository';
import { RiskFactorService } from '../risk-factor/risk-factor.service';
import { RiskFactorRepository } from '../../repositories/risk-factor.repository';
import { RiskEvaluationParameterRepository } from '../../repositories/risk-evaluation-parameter.repository';
import { RiskEvaluationParameter } from '../../models/risk-evaluation-parameter.entity';
import { RiskEvaluationParameterService } from '../risk-evaluation-parameter/risk-evaluation-parameter.service';
import { RiskFactor } from '../../models/risk-factor.entity';
import { RiskApplicationScoringRepository } from '../../repositories/risk-application-scoring.repository';
import { RiskApplicationScoring } from '../../models/risk-application-scoring.entity';
import { RiskHighClassificationScoring } from '../../models/risk-high-classification-scoring.entity';
import { RiskHighClassificationScoringService } from '../risk-high-classification-scoring/risk-high-classification-scoring.service';
import { RiskHighClassificationScoringRepository } from '../../repositories/risk-high-classification-scoring.repository';
import { RiskHighClassificationFactorRepository } from '../../repositories/risk-high-classification-factor.repository';
import { RiskHighClassificationFactor } from '../../models/risk-high-classification-factor.entity';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([
      RiskFactorScoring,
      Application,
      RiskModel,
      RiskEvaluationParameter,
      RiskFactor,
      RiskApplicationScoring,
      RiskHighClassificationScoring,
      RiskHighClassificationFactor,
    ]),
  ],
  controllers: [RiskFactorScoringController],
  providers: [
    RiskFactorScoringService,
    RiskFactorScoringRepository,
    ApplicationRepository,
    RiskModelRepository,
    RiskFactorService,
    RiskEvaluationParameterRepository,
    RiskEvaluationParameterService,
    RiskFactorRepository,
    RiskApplicationScoringRepository,
    RiskHighClassificationScoringService,
    RiskHighClassificationScoringRepository,
    RiskHighClassificationFactorRepository,
  ],
})
export class RiskFactorScoringModule {}
