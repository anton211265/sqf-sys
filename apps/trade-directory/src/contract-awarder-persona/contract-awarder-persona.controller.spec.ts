import { Test, TestingModule } from '@nestjs/testing';
import { ContractAwarderPersonaController } from './contract-awarder-persona.controller';
import { ContractAwarderPersonaService } from './contract-awarder-persona.service';

describe('ContractAwarderPersonaController', () => {
  let controller: ContractAwarderPersonaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContractAwarderPersonaController],
      providers: [ContractAwarderPersonaService],
    }).compile();

    controller = module.get<ContractAwarderPersonaController>(ContractAwarderPersonaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
