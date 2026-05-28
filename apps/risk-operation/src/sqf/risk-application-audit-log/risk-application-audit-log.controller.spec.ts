import { Test, TestingModule } from '@nestjs/testing';
import { RiskApplicationAuditLogController } from './risk-application-audit-log.controller';
import { RiskApplicationAuditLogService } from './risk-application-audit-log.service';

describe('RiskApplicationAuditLogController', () => {
  let controller: RiskApplicationAuditLogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RiskApplicationAuditLogController],
      providers: [RiskApplicationAuditLogService],
    }).compile();

    controller = module.get<RiskApplicationAuditLogController>(RiskApplicationAuditLogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
