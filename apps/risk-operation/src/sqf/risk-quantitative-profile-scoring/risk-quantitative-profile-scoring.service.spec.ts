import { Test, TestingModule } from '@nestjs/testing';
import { RiskQuantitativeProfileScoringService } from './risk-quantitative-profile-scoring.service';

describe('RiskQuantitativeProfileScoringService', () => {
  let service: RiskQuantitativeProfileScoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RiskQuantitativeProfileScoringService],
    }).compile();

    service = module.get<RiskQuantitativeProfileScoringService>(RiskQuantitativeProfileScoringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
