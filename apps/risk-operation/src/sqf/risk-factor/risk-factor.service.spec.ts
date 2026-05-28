import { Test, TestingModule } from '@nestjs/testing';
import { RiskFactorService } from './risk-factor.service';

describe('RiskFactorService', () => {
  let service: RiskFactorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RiskFactorService],
    }).compile();

    service = module.get<RiskFactorService>(RiskFactorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
