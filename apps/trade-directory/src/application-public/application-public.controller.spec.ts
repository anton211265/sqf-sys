import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationPublicController } from './application-public.controller';

describe('ApplicationPublicController', () => {
  let controller: ApplicationPublicController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationPublicController],
      providers: [],
    }).compile();

    controller = module.get<ApplicationPublicController>(
      ApplicationPublicController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
