import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class WeightsDto {
  @IsString()
  @IsNotEmpty()
  parameterName: string;

  @IsOptional()
  @IsString()
  subParameterName?: string | null;

  @IsNumber()
  weight: number;
}

export class CreateRiskQuantitativeProfileWeightDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeightsDto)
  weights: WeightsDto[];
}
