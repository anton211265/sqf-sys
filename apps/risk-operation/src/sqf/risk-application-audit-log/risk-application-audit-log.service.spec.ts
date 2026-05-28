import { Test, TestingModule } from '@nestjs/testing';
import { RiskApplicationAuditLogService } from './risk-application-audit-log.service';

describe('RiskApplicationAuditLogService', () => {
  let service: RiskApplicationAuditLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RiskApplicationAuditLogService],
    }).compile();

    service = module.get<RiskApplicationAuditLogService>(RiskApplicationAuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
