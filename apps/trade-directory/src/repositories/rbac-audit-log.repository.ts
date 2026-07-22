import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { RbacAuditEvent, RbacAuditLog } from '../models/rbac-audit-log.entity';

/**
 * Write-mostly repository for the append-only RBAC ledger. record() accepts
 * an optional EntityManager so audit rows commit in the SAME transaction as
 * the change they document — never async, never droppable (compliance).
 * No update/delete methods exist by design.
 */
@Injectable()
export class RbacAuditLogRepository {
  private readonly logger = new Logger(RbacAuditLogRepository.name);

  constructor(
    @InjectRepository(RbacAuditLog)
    private readonly repository: Repository<RbacAuditLog>,
  ) {}

  async record(
    entry: {
      event: RbacAuditEvent;
      executedByPersonId: number | null;
      organizationId: number | null;
      targetType?: string | null;
      targetId?: number | null;
      metadataPayload?: Record<string, unknown> | null;
      ipAddress?: string | null;
      userAgent?: string | null;
    },
    manager?: EntityManager,
  ): Promise<void> {
    const row = this.repository.create({
      targetType: null,
      targetId: null,
      metadataPayload: null,
      ipAddress: null,
      userAgent: null,
      ...entry,
    });
    if (manager) {
      await manager.save(RbacAuditLog, row);
    } else {
      await this.repository.save(row);
    }
  }

  findForOrganization(
    organizationId: number,
    limit: number,
    offset: number,
  ): Promise<[RbacAuditLog[], number]> {
    return this.repository.findAndCount({
      where: { organizationId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }
}
