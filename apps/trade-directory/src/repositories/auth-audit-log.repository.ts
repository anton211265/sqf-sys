import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthAuditEvent, AuthAuditLog } from '../models/auth-audit-log.entity';

interface AuditParams {
  event: AuthAuditEvent;
  email: string;
  outcome: 'SUCCESS' | 'FAILURE';
  personId?: number | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  detail?: string | null;
}

@Injectable()
export class AuthAuditLogRepository {
  constructor(
    @InjectRepository(AuthAuditLog)
    private readonly repository: Repository<AuthAuditLog>,
  ) {}

  /**
   * Org-scoped read for the Audit Ledger's authentication feed (the table
   * stays append-only — reads only, never UPDATE/DELETE). auth_audit_log
   * has no org column, so scope = rows whose person is a member of the
   * organization; personId-less rows (unknown-email failures) are platform
   * noise visible only to the unscoped (SQFSYS) view.
   */
  async findForOrganization(
    organizationId: number | null,
    limit: number,
    offset: number,
  ): Promise<[AuthAuditLog[], number]> {
    const qb = this.repository
      .createQueryBuilder('log')
      .orderBy('log.createdAt', 'DESC')
      .skip(offset)
      .take(limit);
    if (organizationId !== null) {
      qb.where(
        'log."personId" IN (SELECT op."personId" FROM organization_person op WHERE op."organizationId" = :organizationId)',
        { organizationId },
      );
    }
    return qb.getManyAndCount();
  }

  async record(params: AuditParams): Promise<void> {
    const row = this.repository.create({
      event: params.event,
      email: params.email,
      outcome: params.outcome,
      personId: params.personId ?? null,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      detail: params.detail ?? null,
    });
    await this.repository.insert(row);
  }
}
