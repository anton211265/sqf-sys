import { PartialType } from '@nestjs/swagger';
import { CreateRiskModelDto } from './create-risk-model.dto';
import { IsDefined, IsOptional, IsString } from 'class-validator';

export class UpdateRiskModelDto extends PartialType(CreateRiskModelDto) {
  @IsDefined()
  @IsString()
  @IsOptional()
  riskModelName?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
