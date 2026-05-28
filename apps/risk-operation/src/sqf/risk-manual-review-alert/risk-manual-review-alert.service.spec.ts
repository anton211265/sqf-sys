import { Test, TestingModule } from '@nestjs/testing';
import { RiskManualReviewAlertService } from './risk-manual-review-alert.service';

describe('RiskManualReviewAlertService', () => {
  let service: RiskManualReviewAlertService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RiskManualReviewAlertService],
    }).compile();

    service = module.get<RiskManualReviewAlertService>(RiskManualReviewAlertService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
