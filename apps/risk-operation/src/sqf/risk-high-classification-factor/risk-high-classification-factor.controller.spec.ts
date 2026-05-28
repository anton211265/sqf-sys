import { Test, TestingModule } from '@nestjs/testing';
import { RiskHighClassificationFactorController } from './risk-high-classification-factor.controller';
import { RiskHighClassificationFactorService } from './risk-high-classification-factor.service';

describe('RiskHighClassificationFactorController', () => {
  let controller: RiskHighClassificationFactorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RiskHighClassificationFactorController],
      providers: [RiskHighClassificationFactorService],
    }).compile();

    controller = module.get<RiskHighClassificationFactorController>(RiskHighClassificationFactorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
