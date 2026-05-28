import { Test, TestingModule } from '@nestjs/testing';
import { RiskQuantitativeProfileWeightController } from './risk-quantitative-profile-weight.controller';
import { RiskQuantitativeProfileWeightService } from './risk-quantitative-profile-weight.service';

describe('RiskQuantitativeProfileWeightController', () => {
  let controller: RiskQuantitativeProfileWeightController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RiskQuantitativeProfileWeightController],
      providers: [RiskQuantitativeProfileWeightService],
    }).compile();

    controller = module.get<RiskQuantitativeProfileWeightController>(RiskQuantitativeProfileWeightController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
