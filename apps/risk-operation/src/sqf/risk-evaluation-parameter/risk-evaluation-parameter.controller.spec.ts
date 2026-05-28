import { Test, TestingModule } from '@nestjs/testing';
import { RiskEvaluationParameterController } from './risk-evaluation-parameter.controller';
import { RiskEvaluationParameterService } from './risk-evaluation-parameter.service';

describe('RiskEvaluationParameterController', () => {
  let controller: RiskEvaluationParameterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RiskEvaluationParameterController],
      providers: [RiskEvaluationParameterService],
    }).compile();

    controller = module.get<RiskEvaluationParameterController>(RiskEvaluationParameterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
