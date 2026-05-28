import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class UpdateParameterWeightAndManualTriggerFlagDto {
  @IsString()
  parameterName: string;

  @IsNumber()
  weight: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubParameterDto)
  subParameters: SubParameterDto[];
}

export class SubParameterDto {
  @IsString()
  subParameterName: string;

  @IsNumber()
  weight: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ThresholdRuleDto)
  rules: ThresholdRuleDto[];
}

export class ThresholdRuleDto {
  @IsNumber()
  score: number;

  @IsBoolean()
  isManualTriggerAllowed: boolean;
}
