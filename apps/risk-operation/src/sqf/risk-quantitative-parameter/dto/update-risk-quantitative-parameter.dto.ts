import { PartialType } from '@nestjs/swagger';
import { CreateRiskQuantitativeParameterDto } from './create-risk-quantitative-parameter.dto';

export class UpdateRiskQuantitativeParameterDto extends PartialType(CreateRiskQuantitativeParameterDto) {}
