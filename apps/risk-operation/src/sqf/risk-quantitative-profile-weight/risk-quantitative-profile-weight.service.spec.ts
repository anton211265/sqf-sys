import { Test, TestingModule } from '@nestjs/testing';
import { RiskQuantitativeProfileWeightService } from './risk-quantitative-profile-weight.service';

describe('RiskQuantitativeProfileWeightService', () => {
  let service: RiskQuantitativeProfileWeightService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RiskQuantitativeProfileWeightService],
    }).compile();

    service = module.get<RiskQuantitativeProfileWeightService>(RiskQuantitativeProfileWeightService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
