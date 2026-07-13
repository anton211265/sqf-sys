import { Test, TestingModule } from '@nestjs/testing';
import { KycAgencyService } from './kyc-agency.service';

describe('KycAgencyService', () => {
  let service: KycAgencyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KycAgencyService],
    }).compile();

    service = module.get<KycAgencyService>(KycAgencyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
