import { Test, TestingModule } from '@nestjs/testing';
import { RiskFactorController } from './risk-factor.controller';
import { RiskFactorService } from './risk-factor.service';

describe('RiskFactorController', () => {
  let controller: RiskFactorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RiskFactorController],
      providers: [RiskFactorService],
    }).compile();

    controller = module.get<RiskFactorController>(RiskFactorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
