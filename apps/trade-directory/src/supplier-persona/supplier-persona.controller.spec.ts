import { Test, TestingModule } from '@nestjs/testing';
import { SupplierPersonaController } from './supplier-persona.controller';
import { SupplierPersonaService } from './supplier-persona.service';

describe('SupplierPersonaController', () => {
  let controller: SupplierPersonaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupplierPersonaController],
      providers: [SupplierPersonaService],
    }).compile();

    controller = module.get<SupplierPersonaController>(SupplierPersonaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
