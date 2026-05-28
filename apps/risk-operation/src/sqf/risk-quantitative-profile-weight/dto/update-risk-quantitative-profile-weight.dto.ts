import { PartialType } from '@nestjs/swagger';
import { CreateRiskQuantitativeProfileWeightDto } from './create-risk-quantitative-profile-weight.dto';

export class UpdateRiskQuantitativeProfileWeightDto extends PartialType(CreateRiskQuantitativeProfileWeightDto) {}
