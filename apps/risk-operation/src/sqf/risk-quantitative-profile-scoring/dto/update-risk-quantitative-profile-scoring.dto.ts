import { PartialType } from '@nestjs/swagger';
import { CreateRiskQuantitativeProfileScoringDto } from './create-risk-quantitative-profile-scoring.dto';

export class UpdateRiskQuantitativeProfileScoringDto extends PartialType(CreateRiskQuantitativeProfileScoringDto) {}
