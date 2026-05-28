import { PartialType } from '@nestjs/swagger';
import { CreateRiskFactorDto } from './create-risk-factor.dto';

export class UpdateRiskFactorDto extends PartialType(CreateRiskFactorDto) {}
