import { Test, TestingModule } from '@nestjs/testing';
import { RiskFactorScoringService } from './risk-factor-scoring.service';

describe('RiskFactorScoringService', () => {
  let service: RiskFactorScoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RiskFactorScoringService],
    }).compile();

    service = module.get<RiskFactorScoringService>(RiskFactorScoringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
