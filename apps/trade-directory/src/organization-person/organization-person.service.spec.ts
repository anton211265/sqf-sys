import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationPersonService } from './organization-person.service';

describe('OrganizationPersonService', () => {
  let service: OrganizationPersonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrganizationPersonService],
    }).compile();

    service = module.get<OrganizationPersonService>(OrganizationPersonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
