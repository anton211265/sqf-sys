import { Module } from '@nestjs/common';
import { RiskApplicationScoringService } from './risk-application-scoring.service';
import { RiskApplicationScoringController } from './risk-application-scoring.controller';
import { DatabaseModule } from '@app/common/database/database.module';
import { RiskApplicationScoring } from '../../models/risk-application-scoring.entity';
import { RiskApplicationScoringRepository } from '../../repositories/risk-application-scoring.repository';
import { ApplicationRepository } from '../../repositories/application.repository';
import { Application } from '../../models/application.entity';
import { RiskModelRepository } from '../../repositories/risk-model.repository';
import { RiskModel } from '../../models/risk-model.entity';
import { RiskFactorService } from '../risk-factor/risk-factor.service';
import { RiskFactor } from '../../models/risk-factor.entity';
import { RiskFactorScoringRepository } from '../../repositories/risk-factor-scoring.repository';
import { RiskFactorScoring } from '../../models/risk-factor-scoring.entity';
import { RiskFactorRepository } from '../../repositories/risk-factor.repository';
import { RiskEvaluationParameterRepository } from '../../repositories/risk-evaluation-parameter.repository';
import { RiskEvaluationParameter } from '../../models/risk-evaluation-parameter.entity';
import { RiskEvaluationParameterService } from '../risk-evaluation-parameter/risk-evaluation-parameter.service';
import { RiskProfileRepository } from '../../repositories/risk-profile.repository';
import { RiskProfile } from '../../models/risk-profile.entity';
import { RiskManualReviewAlert } from '../../models/risk-manual-review-alert.entity';
import { RiskManualReviewAlertRepository } from '../../repositories/risk-manual-review-alert.repository';
import { RiskApplicationAuditLog } from '../../models/risk-application-audit-log.entity';
import { RiskApplicationAuditLogService } from '../risk-application-audit-log/risk-application-audit-log.service';
import { RiskApplicationAuditLogRepository } from '../../repositories/risk-application-audit-log.repository';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([
      RiskApplicationScoring,
      Application,
      RiskModel,
      RiskFactor,
      RiskFactorScoring,
      RiskEvaluationParameter,
      RiskProfile,
      RiskManualReviewAlert,
      RiskApplicationAuditLog,
    ]),
  ],
  controllers: [RiskApplicationScoringController],
  providers: [
    RiskApplicationScoringService,
    RiskApplicationScoringRepository,
    ApplicationRepository,
    RiskModelRepository,
    RiskFactorService,
    RiskFactorScoringRepository,
    RiskFactorRepository,
    RiskEvaluationParameterRepository,
    RiskEvaluationParameterService,
    RiskProfileRepository,
    RiskManualReviewAlertRepository,
    RiskApplicationAuditLogService,
    RiskApplicationAuditLogRepository,
  ],
})
export class RiskApplicationScoringModule {}
