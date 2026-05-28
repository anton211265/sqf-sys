import { Test, TestingModule } from '@nestjs/testing';
import { ClientPersonaController } from './client-persona.controller';
import { ClientPersonaService } from './client-persona.service';

describe('ClientPersonaController', () => {
  let controller: ClientPersonaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientPersonaController],
      providers: [ClientPersonaService],
    }).compile();

    controller = module.get<ClientPersonaController>(ClientPersonaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
