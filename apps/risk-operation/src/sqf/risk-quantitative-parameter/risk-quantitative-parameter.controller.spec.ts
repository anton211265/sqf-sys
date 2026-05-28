import { Test, TestingModule } from '@nestjs/testing';
import { RiskQuantitativeParameterController } from './risk-quantitative-parameter.controller';
import { RiskQuantitativeParameterService } from './risk-quantitative-parameter.service';

describe('RiskQuantitativeParameterController', () => {
  let controller: RiskQuantitativeParameterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RiskQuantitativeParameterController],
      providers: [RiskQuantitativeParameterService],
    }).compile();

    controller = module.get<RiskQuantitativeParameterController>(RiskQuantitativeParameterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
