import { ThresholdBreachTriggerComparisonOperatorEnum } from '@app/common/apps/risk-operation/enums/threshold-breach-trigger-comparison-operator.enum';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ThresholdRuleDto {
  @IsNumber()
  score: number;

  @IsOptional()
  @IsNumber()
  thresholdValue: number | null;

  @IsOptional()
  @IsString()
  thresholdLabel?: string | null;

  @IsEnum(ThresholdBreachTriggerComparisonOperatorEnum)
  comparisonOperator: ThresholdBreachTriggerComparisonOperatorEnum;

  @IsBoolean()
  isManualTriggerAllowed: boolean;
}

export class CreateRiskQuantitativeThresholdRuleDto {
  @IsString()
  quantitativeParameter: string;

  @IsString()
  quantitativeSubParameter: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ThresholdRuleDto)
  rules: ThresholdRuleDto[];
}
