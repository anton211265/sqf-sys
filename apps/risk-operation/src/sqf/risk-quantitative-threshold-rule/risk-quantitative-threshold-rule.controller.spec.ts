import { Test, TestingModule } from '@nestjs/testing';
import { RiskQuantitativeThresholdRuleController } from './risk-quantitative-threshold-rule.controller';
import { RiskQuantitativeThresholdRuleService } from './risk-quantitative-threshold-rule.service';

describe('RiskQuantitativeThresholdRuleController', () => {
  let controller: RiskQuantitativeThresholdRuleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RiskQuantitativeThresholdRuleController],
      providers: [RiskQuantitativeThresholdRuleService],
    }).compile();

    controller = module.get<RiskQuantitativeThresholdRuleController>(RiskQuantitativeThresholdRuleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
