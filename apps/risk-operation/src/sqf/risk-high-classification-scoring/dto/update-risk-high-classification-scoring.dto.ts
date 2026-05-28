import { PartialType } from '@nestjs/swagger';
import { CreateRiskHighClassificationScoringDto } from './create-risk-high-classification-scoring.dto';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class UpdateRiskHighClassificationScoringDto extends PartialType(
  CreateRiskHighClassificationScoringDto,
) {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true }) // Ensures each item is a string
  riskFactors: string[];
}
