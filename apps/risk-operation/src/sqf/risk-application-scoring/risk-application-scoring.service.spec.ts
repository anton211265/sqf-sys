import { Test, TestingModule } from '@nestjs/testing';
import { RiskApplicationScoringService } from './risk-application-scoring.service';

describe('RiskApplicationScoringService', () => {
  let service: RiskApplicationScoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RiskApplicationScoringService],
    }).compile();

    service = module.get<RiskApplicationScoringService>(RiskApplicationScoringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
