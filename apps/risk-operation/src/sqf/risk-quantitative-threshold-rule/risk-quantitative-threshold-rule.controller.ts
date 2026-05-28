import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RiskQuantitativeThresholdRuleService } from './risk-quantitative-threshold-rule.service';
import { CreateRiskQuantitativeThresholdRuleDto } from './dto/create-risk-quantitative-threshold-rule.dto';

@Controller('/api/risk-quantitative-threshold-rule')
export class RiskQuantitativeThresholdRuleController {
  constructor(
    private readonly riskQuantitativeThresholdRuleService: RiskQuantitativeThresholdRuleService,
  ) {}

  @Post(':riskProfileCode')
  create(
    @Param('riskProfileCode') riskProfileCode: string,
    @Body()
    createRiskQuantitativeThresholdRuleDto: CreateRiskQuantitativeThresholdRuleDto,
  ) {
    return this.riskQuantitativeThresholdRuleService.create(
      riskProfileCode,
      createRiskQuantitativeThresholdRuleDto,
    );
  }

  @Post(':riskProfileCode/duplicate-default-threshold')
  duplicateDefaultThresholdRules(
    @Param('riskProfileCode') riskProfileCode: string,
  ) {
    return this.riskQuantitativeThresholdRuleService.duplicateDefaultThresholdRules(
      riskProfileCode,
    );
  }

  @Get()
  findAll() {
    return this.riskQuantitativeThresholdRuleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.riskQuantitativeThresholdRuleService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.riskQuantitativeThresholdRuleService.remove(+id);
  }
}
