import { Test, TestingModule } from '@nestjs/testing';
import { RiskFactorScoringController } from './risk-factor-scoring.controller';
import { RiskFactorScoringService } from './risk-factor-scoring.service';

describe('RiskFactorScoringController', () => {
  let controller: RiskFactorScoringController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RiskFactorScoringController],
      providers: [RiskFactorScoringService],
    }).compile();

    controller = module.get<RiskFactorScoringController>(RiskFactorScoringController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
