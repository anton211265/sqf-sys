import { Test, TestingModule } from '@nestjs/testing';
import { RiskApplicationScoringController } from './risk-application-scoring.controller';
import { RiskApplicationScoringService } from './risk-application-scoring.service';

describe('RiskApplicationScoringController', () => {
  let controller: RiskApplicationScoringController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RiskApplicationScoringController],
      providers: [RiskApplicationScoringService],
    }).compile();

    controller = module.get<RiskApplicationScoringController>(RiskApplicationScoringController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
