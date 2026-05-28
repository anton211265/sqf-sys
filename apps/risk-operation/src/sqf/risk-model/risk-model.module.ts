import { Module } from '@nestjs/common';
import { RiskModelService } from './risk-model.service';
import { RiskModelController } from './risk-model.controller';
import { RiskModelRepository } from '../../repositories/risk-model.repository';
import { DatabaseModule } from '@app/common/database/database.module';
import { RiskModel } from '../../models/risk-model.entity';
import { RiskHighClassificationFactor } from '../../models/risk-high-classification-factor.entity';
import { RiskFactor } from '../../models/risk-factor.entity';
import { RiskFactorService } from '../risk-factor/risk-factor.service';
import { RiskFactorRepository } from '../../repositories/risk-factor.repository';
import { RiskEvaluationParameterRepository } from '../../repositories/risk-evaluation-parameter.repository';
import { RiskEvaluationParameter } from '../../models/risk-evaluation-parameter.entity';
import { RiskEvaluationParameterService } from '../risk-evaluation-parameter/risk-evaluation-parameter.service';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([
      RiskModel,
      RiskHighClassificationFactor,
      RiskFactor,
      RiskEvaluationParameter,
    ]),
  ],
  controllers: [RiskModelController],
  providers: [
    RiskModelService,
    RiskModelRepository,
    RiskFactorService,
    RiskFactorRepository,
    RiskEvaluationParameterRepository,
    RiskEvaluationParameterService,
  ],
})
export class RiskModelModule {}
