import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  ValidateNested,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

class RiskFactorScoringDto {
  @IsNumber()
  @IsNotEmpty()
  riskFactorId: number;

  @IsString()
  @IsNotEmpty()
  riskFactorName: string;

  @IsBoolean()
  isSetAsCategory: boolean;

  @IsBoolean()
  isRequireEvaluationParameter: boolean;

  @IsOptional()
  @IsNumber()
  selectedEvaluationParamId?: number | null;

  @IsOptional()
  @IsString()
  selectedCountry?: string | null;

  @IsOptional()
  @IsNumber()
  score?: number | null;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RiskFactorScoringDto)
  subFactors?: RiskFactorScoringDto[];
}

export class AssignScoreToRiskFactorScoringDto {
  @IsString()
  @IsNotEmpty()
  riskModelNumber: string;

  @ValidateNested()
  @Type(() => RiskFactorScoringDto)
  riskScoringSurveyData: RiskFactorScoringDto;
}
