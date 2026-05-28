import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationPersonService } from './application-person.service';

describe('ApplicationPersonService', () => {
  let service: ApplicationPersonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApplicationPersonService],
    }).compile();

    service = module.get<ApplicationPersonService>(ApplicationPersonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
