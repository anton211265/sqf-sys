import { Test, TestingModule } from '@nestjs/testing';
import { RiskProfileController } from './risk-profile.controller';
import { RiskProfileService } from './risk-profile.service';

describe('RiskProfileController', () => {
  let controller: RiskProfileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RiskProfileController],
      providers: [RiskProfileService],
    }).compile();

    controller = module.get<RiskProfileController>(RiskProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
