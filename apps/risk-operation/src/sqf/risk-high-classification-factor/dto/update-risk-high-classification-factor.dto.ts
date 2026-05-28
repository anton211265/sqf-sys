import { PartialType } from '@nestjs/swagger';
import { CreateRiskHighClassificationFactorDto } from './create-risk-high-classification-factor.dto';
import { IsDefined, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateRiskHighClassificationFactorDto extends PartialType(
  CreateRiskHighClassificationFactorDto,
) {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  riskFactor?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
