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
