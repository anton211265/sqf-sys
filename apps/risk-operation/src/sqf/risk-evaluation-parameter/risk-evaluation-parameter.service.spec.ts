import { Test, TestingModule } from '@nestjs/testing';
import { RiskEvaluationParameterService } from './risk-evaluation-parameter.service';

describe('RiskEvaluationParameterService', () => {
  let service: RiskEvaluationParameterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RiskEvaluationParameterService],
    }).compile();

    service = module.get<RiskEvaluationParameterService>(RiskEvaluationParameterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
