import { Test, TestingModule } from '@nestjs/testing';
import { RiskHighClassificationFactorService } from './risk-high-classification-factor.service';

describe('RiskHighClassificationFactorService', () => {
  let service: RiskHighClassificationFactorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RiskHighClassificationFactorService],
    }).compile();

    service = module.get<RiskHighClassificationFactorService>(RiskHighClassificationFactorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
