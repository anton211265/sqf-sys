import { RiskCategoryEnum } from '@app/common/apps/risk-operation/enums/risk-category.enum';
import { RiskEvalScoreTypeEnum } from '@app/common/apps/risk-operation/enums/risk-eval-score-type.enum';
import { Transform, Type } from 'class-transformer';
import {
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';

export class CreateRiskEvaluationParameterDto {
  @IsOptional()
  @IsNumber()
  riskFactorId?: number;

  @IsOptional()
  @IsNumber()
  parentId?: number;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.toUpperCase())
  name: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsNumber()
  @IsOptional()
  @Min(1) // Minimum weight is 1%
  @Max(100) // Minimum weight is 100%
  weight: number | null;

  @IsEnum(RiskCategoryEnum)
  @IsString()
  @IsOptional()
  riskCategory: RiskCategoryEnum;

  @IsEnum(RiskEvalScoreTypeEnum)
  @IsString()
  @IsOptional()
  scoreType: RiskEvalScoreTypeEnum;

  @IsOptional()
  @IsNumber()
  fixedScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  scoreRangeMin?: number;

  @IsOptional()
  @IsNumber()
  @Max(100)
  scoreRangeMax?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRiskEvaluationParameterDto)
  subEvaluationParams?: CreateRiskEvaluationParameterDto[];
}
