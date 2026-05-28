import { Module } from '@nestjs/common';
import { RiskFactorService } from './risk-factor.service';
import { RiskFactorController } from './risk-factor.controller';
import { DatabaseModule } from '@app/common/database/database.module';
import { RiskFactor } from '../../models/risk-factor.entity';
import { RiskFactorRepository } from '../../repositories/risk-factor.repository';
import { RiskModelRepository } from '../../repositories/risk-model.repository';
import { RiskModel } from '../../models/risk-model.entity';
import { RiskEvaluationParameterService } from '../risk-evaluation-parameter/risk-evaluation-parameter.service';
import { RiskEvaluationParameterRepository } from '../../repositories/risk-evaluation-parameter.repository';
import { RiskEvaluationParameter } from '../../models/risk-evaluation-parameter.entity';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([RiskFactor, RiskModel, RiskEvaluationParameter]),
  ],
  controllers: [RiskFactorController],
  providers: [
    RiskFactorService,
    RiskFactorRepository,
    RiskModelRepository,
    RiskEvaluationParameterService,
    RiskEvaluationParameterRepository,
  ],
})
export class RiskFactorModule {}
