import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationPersonController } from './organization-person.controller';
import { OrganizationPersonService } from './organization-person.service';

describe('OrganizationPersonController', () => {
  let controller: OrganizationPersonController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationPersonController],
      providers: [OrganizationPersonService],
    }).compile();

    controller = module.get<OrganizationPersonController>(OrganizationPersonController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
