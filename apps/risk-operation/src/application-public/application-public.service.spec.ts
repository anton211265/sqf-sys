import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationPublicService } from './application-public.service';

describe('ApplicationPublicService', () => {
  let service: ApplicationPublicService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApplicationPublicService],
    }).compile();

    service = module.get<ApplicationPublicService>(ApplicationPublicService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
