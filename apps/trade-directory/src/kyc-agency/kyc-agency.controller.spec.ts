import { Test, TestingModule } from '@nestjs/testing';
import { KycAgencyController } from './kyc-agency.controller';
import { KycAgencyService } from './kyc-agency.service';

describe('KycAgencyController', () => {
  let controller: KycAgencyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KycAgencyController],
      providers: [KycAgencyService],
    }).compile();

    controller = module.get<KycAgencyController>(KycAgencyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
