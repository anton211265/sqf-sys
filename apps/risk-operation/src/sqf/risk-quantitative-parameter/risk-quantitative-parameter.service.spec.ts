import { Test, TestingModule } from '@nestjs/testing';
import { RiskQuantitativeParameterService } from './risk-quantitative-parameter.service';

describe('RiskQuantitativeParameterService', () => {
  let service: RiskQuantitativeParameterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RiskQuantitativeParameterService],
    }).compile();

    service = module.get<RiskQuantitativeParameterService>(RiskQuantitativeParameterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
