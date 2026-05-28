import { Test, TestingModule } from '@nestjs/testing';
import { RiskHighClassificationScoringService } from './risk-high-classification-scoring.service';

describe('RiskHighClassificationScoringService', () => {
  let service: RiskHighClassificationScoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RiskHighClassificationScoringService],
    }).compile();

    service = module.get<RiskHighClassificationScoringService>(RiskHighClassificationScoringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
