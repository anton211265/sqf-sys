import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  PrimaryColumn,
} from 'typeorm';

export enum RbacAuditEvent {
  ROLE_CREATED = 'ROLE_CREATED',
  ROLE_UPDATED = 'ROLE_UPDATED',
  ROLE_DELETED = 'ROLE_DELETED',
  ROLE_PERMISSIONS_CHANGED = 'ROLE_PERMISSIONS_CHANGED',
  USER_ROLE_ASSIGNED = 'USER_ROLE_ASSIGNED',
  USER_ROLE_REMOVED = 'USER_ROLE_REMOVED',
  SESSIONS_REVOKED = 'SESSIONS_REVOKED',
  TAMPER_ATTEMPT = 'TAMPER_ATTEMPT',
}

/**
 * Append-only ledger of access-control changes (Bank Negara evidence trail).
 * Rows are written in the SAME transaction as the change they record —
 * deliberately not async (an audit write that can be dropped under failure
 * is worthless for compliance, and role admin ops are rare). No UPDATE or
 * DELETE is ever issued against this table; production hardening adds an
 * INSERT-only DB grant (Terraform phase).
 */
@Entity({ name: 'rbac_audit_log' })
export class RbacAuditLog {
  @PrimaryColumn({ type: 'uuid' })
  @Generated('uuid')
  id: string;

  @Column({ type: 'varchar' })
  event: RbacAuditEvent;

  @Column({ type: 'int', nullable: true })
  executedByPersonId: number | null;

  // Tenant scope of the change (the Funder org whose RBAC config changed)
  @Column({ type: 'int', nullable: true })
  organizationId: number | null;

  // e.g. 'role' | 'person' — with the row id it identifies the target
  @Column({ type: 'varchar', nullable: true })
  targetType: string | null;

  @Column({ type: 'int', nullable: true })
  targetId: number | null;

  // { historical_state: {...}, transformed_state: {...}, ... } — the
  // before/after snapshot block required by the RBAC spec
  @Column({ type: 'jsonb', nullable: true })
  metadataPayload: Record<string, unknown> | null;

  @Column({ type: 'varchar', nullable: true })
  ipAddress: string | null;

  @Column({ type: 'varchar', nullable: true })
  userAgent: string | null;

  @CreateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
  })
  createdAt: Date;
}
