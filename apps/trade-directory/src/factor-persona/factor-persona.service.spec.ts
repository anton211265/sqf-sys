import { Test, TestingModule } from '@nestjs/testing';
import { FactorPersonaService } from './factor-persona.service';

describe('FactorPersonaService', () => {
  let service: FactorPersonaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FactorPersonaService],
    }).compile();

    service = module.get<FactorPersonaService>(FactorPersonaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
