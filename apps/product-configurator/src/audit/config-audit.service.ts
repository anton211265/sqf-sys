import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  ConfigActorTypeEnum,
  ProductConfigAuditLog,
} from '../models/product-config-audit-log.entity';

export interface AuditEntry {
  targetTable: string;
  entityId: string | number;
  productId?: number | null;
  actorPersonId: number;
  actionPerformed:
    | 'CREATE'
    | 'UPDATE'
    | 'OVERRIDE'
    | 'PUBLISH'
    | 'ARCHIVE'
    | 'BIND'
    | 'DELETE';
  oldValues?: Record<string, unknown> | null;
  newValues: Record<string, unknown>;
  changeReason?: string | null;
  funderOrganizationId: number;
  actorType?: ConfigActorTypeEnum;
}

@Injectable()
export class ConfigAuditService {
  constructor(
    @InjectRepository(ProductConfigAuditLog)
    private readonly repository: Repository<ProductConfigAuditLog>,
  ) {}

  /**
   * Append an audit row inside the caller's transaction — the audit trail
   * and the business change commit or roll back together.
   */
  async record(manager: EntityManager, entry: AuditEntry): Promise<void> {
    await manager.insert(ProductConfigAuditLog, {
      targetTable: entry.targetTable,
      entityId: String(entry.entityId),
      productId: entry.productId ?? null,
      actorType: entry.actorType ?? ConfigActorTypeEnum.HUMAN_PM,
      actorIdentifier: String(entry.actorPersonId),
      actionPerformed: entry.actionPerformed,
      oldValues: entry.oldValues ?? null,
      newValues: entry.newValues,
      changeReason: entry.changeReason ?? null,
      funderOrganizationId: entry.funderOrganizationId,
    });
  }

  async list(funderOrganizationId: number, limit = 100) {
    const where =
      funderOrganizationId === 0 ? {} : { funderOrganizationId };
    const [rows, total] = await this.repository.findAndCount({
      where,
      order: { id: 'DESC' },
      take: Math.min(limit, 500),
    });
    return { total, rows };
  }
}
