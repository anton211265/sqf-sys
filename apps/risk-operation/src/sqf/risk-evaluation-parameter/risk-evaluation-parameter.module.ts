import { Module } from '@nestjs/common';
import { RiskEvaluationParameterService } from './risk-evaluation-parameter.service';
import { RiskEvaluationParameterController } from './risk-evaluation-parameter.controller';
import { DatabaseModule } from '@app/common/database/database.module';
import { RiskEvaluationParameter } from '../../models/risk-evaluation-parameter.entity';
import { RiskEvaluationParameterRepository } from '../../repositories/risk-evaluation-parameter.repository';
import { RiskFactorRepository } from '../../repositories/risk-factor.repository';
import { RiskFactor } from '../../models/risk-factor.entity';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([RiskEvaluationParameter, RiskFactor]),
  ],
  controllers: [RiskEvaluationParameterController],
  providers: [
    RiskEvaluationParameterService,
    RiskEvaluationParameterRepository,
    RiskFactorRepository,
  ],
})
export class RiskEvaluationParameterModule {}
