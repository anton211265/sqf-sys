import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ConfigActorTypeEnum {
  HUMAN_PM = 'HUMAN_PM',
  AI_AGENT = 'AI_AGENT',
}

/**
 * Append-only configuration audit trail (spec §3
 * "product_config_audit_logs"). Written app-side in the SAME transaction as
 * the business change — not via the spec's PG triggers — matching the
 * Dynamic RBAC audit ruling (same-transaction, deliberately not async, and
 * the actor is the real caller rather than a trigger-level placeholder).
 */
@Entity('product_config_audit_log')
export class ProductConfigAuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  targetTable: string;

  @Column({ type: 'varchar' })
  entityId: string;

  @Index()
  @Column({ type: 'integer', nullable: true })
  productId: number | null;

  @Column({ type: 'varchar' })
  actorType: ConfigActorTypeEnum;

  @Index()
  @Column({ type: 'varchar' })
  actorIdentifier: string;

  @Column({ type: 'varchar' })
  actionPerformed: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValues: Record<string, unknown> | null;

  @Column({ type: 'jsonb' })
  newValues: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  changeReason: string | null;

  @Column({ type: 'integer' })
  funderOrganizationId: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'LOCALTIMESTAMP' })
  createdAt: Date;
}
