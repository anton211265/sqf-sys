import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { RiskQuantitativeThresholdRule } from '../models/risk-quantitative-threshold-rule.entity';
import { RiskApplicationAuditLog } from '../models/risk-application-audit-log.entity';

export class RiskApplicationAuditLogRepository extends AbstractRepository<RiskApplicationAuditLog> {
  protected readonly logger = new Logger(RiskApplicationAuditLog.name);

  constructor(
    @InjectRepository(RiskApplicationAuditLog)
    repository: Repository<RiskApplicationAuditLog>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
