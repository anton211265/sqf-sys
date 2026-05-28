import { Transform, Type } from 'class-transformer';
import {
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateRiskHighClassificationFactorDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.toUpperCase())
  riskFactor: string;

  @IsOptional()
  @IsString()
  description?: string;
}
