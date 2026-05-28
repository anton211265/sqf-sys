import { Test, TestingModule } from '@nestjs/testing';
import { RiskQuantitativeThresholdRuleService } from './risk-quantitative-threshold-rule.service';

describe('RiskQuantitativeThresholdRuleService', () => {
  let service: RiskQuantitativeThresholdRuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RiskQuantitativeThresholdRuleService],
    }).compile();

    service = module.get<RiskQuantitativeThresholdRuleService>(RiskQuantitativeThresholdRuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
