import { Module } from '@nestjs/common';
import { RiskApplicationAuditLogService } from './risk-application-audit-log.service';
import { RiskApplicationAuditLogController } from './risk-application-audit-log.controller';
import { RiskApplicationAuditLogRepository } from '../../repositories/risk-application-audit-log.repository';
import { DatabaseModule } from '@app/common/database/database.module';
import { RiskApplicationAuditLog } from '../../models/risk-application-audit-log.entity';
import { ApplicationRepository } from '../../repositories';
import { Application } from '../../models';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([RiskApplicationAuditLog, Application]),
  ],
  controllers: [RiskApplicationAuditLogController],
  providers: [
    RiskApplicationAuditLogService,
    RiskApplicationAuditLogRepository,
    ApplicationRepository,
  ],
})
export class RiskApplicationAuditLogModule {}
