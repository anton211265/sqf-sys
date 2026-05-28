import { Test, TestingModule } from '@nestjs/testing';
import { ClientAssigneeController } from './client-assignee.controller';
import { ClientAssigneeService } from './client-assignee.service';

describe('ClientAssigneeController', () => {
  let controller: ClientAssigneeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientAssigneeController],
      providers: [ClientAssigneeService],
    }).compile();

    controller = module.get<ClientAssigneeController>(ClientAssigneeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
