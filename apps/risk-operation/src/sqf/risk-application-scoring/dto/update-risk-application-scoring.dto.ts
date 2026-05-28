import { PartialType } from '@nestjs/swagger';
import { CreateRiskApplicationScoringDto } from './create-risk-application-scoring.dto';

export class UpdateRiskApplicationScoringDto extends PartialType(CreateRiskApplicationScoringDto) {}
