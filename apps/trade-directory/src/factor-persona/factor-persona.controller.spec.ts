import { Test, TestingModule } from '@nestjs/testing';
import { FactorPersonaController } from './factor-persona.controller';
import { FactorPersonaService } from './factor-persona.service';

describe('FactorPersonaController', () => {
  let controller: FactorPersonaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FactorPersonaController],
      providers: [FactorPersonaService],
    }).compile();

    controller = module.get<FactorPersonaController>(FactorPersonaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
