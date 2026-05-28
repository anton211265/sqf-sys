import { Test, TestingModule } from '@nestjs/testing';
import { SupplierPersonaService } from './supplier-persona.service';

describe('SupplierPersonaService', () => {
  let service: SupplierPersonaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplierPersonaService],
    }).compile();

    service = module.get<SupplierPersonaService>(SupplierPersonaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
