import { Test, TestingModule } from '@nestjs/testing';
import { ContractAwarderPersonaService } from './contract-awarder-persona.service';

describe('ContractAwarderPersonaService', () => {
  let service: ContractAwarderPersonaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContractAwarderPersonaService],
    }).compile();

    service = module.get<ContractAwarderPersonaService>(ContractAwarderPersonaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
