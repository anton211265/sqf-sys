import { Test, TestingModule } from '@nestjs/testing';
import { ClientPersonaService } from './client-persona.service';

describe('ClientPersonaService', () => {
  let service: ClientPersonaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientPersonaService],
    }).compile();

    service = module.get<ClientPersonaService>(ClientPersonaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
