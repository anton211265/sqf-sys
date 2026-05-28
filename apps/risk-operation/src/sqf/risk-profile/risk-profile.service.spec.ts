import { Test, TestingModule } from '@nestjs/testing';
import { RiskProfileService } from './risk-profile.service';

describe('RiskProfileService', () => {
  let service: RiskProfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RiskProfileService],
    }).compile();

    service = module.get<RiskProfileService>(RiskProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
