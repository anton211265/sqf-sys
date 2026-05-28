import { Test, TestingModule } from '@nestjs/testing';
import { RiskManualReviewAlertController } from './risk-manual-review-alert.controller';
import { RiskManualReviewAlertService } from './risk-manual-review-alert.service';

describe('RiskManualReviewAlertController', () => {
  let controller: RiskManualReviewAlertController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RiskManualReviewAlertController],
      providers: [RiskManualReviewAlertService],
    }).compile();

    controller = module.get<RiskManualReviewAlertController>(RiskManualReviewAlertController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
