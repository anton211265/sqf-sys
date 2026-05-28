import { Test, TestingModule } from '@nestjs/testing';
import { RiskHighClassificationScoringController } from './risk-high-classification-scoring.controller';
import { RiskHighClassificationScoringService } from './risk-high-classification-scoring.service';

describe('RiskHighClassificationScoringController', () => {
  let controller: RiskHighClassificationScoringController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RiskHighClassificationScoringController],
      providers: [RiskHighClassificationScoringService],
    }).compile();

    controller = module.get<RiskHighClassificationScoringController>(RiskHighClassificationScoringController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
