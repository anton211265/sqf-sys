import { PartialType } from '@nestjs/swagger';
import { AssignScoreToRiskFactorScoringDto } from './assign-score-to-risk-factor-scoring.dto';

export class UpdateRiskFactorScoringDto extends PartialType(AssignScoreToRiskFactorScoringDto) {}
