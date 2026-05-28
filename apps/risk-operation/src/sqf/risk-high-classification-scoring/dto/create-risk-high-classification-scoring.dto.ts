import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class CreateRiskHighClassificationScoringDto {
  @IsArray()
  @IsString({ each: true }) // Ensures each item is a string
  riskFactors: string[]; // Allow array to be empty
}
