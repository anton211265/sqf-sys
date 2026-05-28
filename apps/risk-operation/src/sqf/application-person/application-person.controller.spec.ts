import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationPersonController } from './application-person.controller';
import { ApplicationPersonService } from './application-person.service';

describe('ApplicationPersonController', () => {
  let controller: ApplicationPersonController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationPersonController],
      providers: [ApplicationPersonService],
    }).compile();

    controller = module.get<ApplicationPersonController>(ApplicationPersonController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
