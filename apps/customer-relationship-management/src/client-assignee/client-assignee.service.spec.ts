import { Test, TestingModule } from '@nestjs/testing';
import { ClientAssigneeService } from './client-assignee.service';

describe('ClientAssigneeService', () => {
  let service: ClientAssigneeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientAssigneeService],
    }).compile();

    service = module.get<ClientAssigneeService>(ClientAssigneeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
