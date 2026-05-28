import { Test, TestingModule } from '@nestjs/testing';
import { RiskQuantitativeProfileScoringController } from './risk-quantitative-profile-scoring.controller';
import { RiskQuantitativeProfileScoringService } from './risk-quantitative-profile-scoring.service';

describe('RiskQuantitativeProfileScoringController', () => {
  let controller: RiskQuantitativeProfileScoringController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RiskQuantitativeProfileScoringController],
      providers: [RiskQuantitativeProfileScoringService],
    }).compile();

    controller = module.get<RiskQuantitativeProfileScoringController>(RiskQuantitativeProfileScoringController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
