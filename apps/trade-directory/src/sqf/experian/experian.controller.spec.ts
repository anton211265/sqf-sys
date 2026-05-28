import { Test, TestingModule } from '@nestjs/testing';
import { ExperianController } from './experian.controller';

describe('ExperianController', () => {
  let controller: ExperianController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExperianController],
    }).compile();

    controller = module.get<ExperianController>(ExperianController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
