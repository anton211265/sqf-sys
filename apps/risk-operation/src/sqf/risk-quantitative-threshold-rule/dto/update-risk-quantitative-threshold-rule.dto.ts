import { PartialType } from '@nestjs/swagger';
import { CreateRiskQuantitativeThresholdRuleDto } from './create-risk-quantitative-threshold-rule.dto';

export class UpdateRiskQuantitativeThresholdRuleDto extends PartialType(CreateRiskQuantitativeThresholdRuleDto) {}
