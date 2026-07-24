import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SlaTemplate } from './governance-config.entity';

export enum SlaTimerStatusEnum {
  RUNNING = 'RUNNING',
  RESOLVED = 'RESOLVED',
  BREACHED = 'BREACHED',
}

/**
 * Runtime SLA timer instance (config lives in sla_template). subjectType/
 * subjectId identify the business object the clock runs against (e.g.
 * APPLICATION #123) — bare identifiers, no cross-DB FK, per the house
 * cross-service rule. deadlineAt is computed once at start (HOURS/DAYS are
 * absolute; WORKING_DAYS skips weekends plus the funder's clearing-calendar
 * HOLIDAY/SHUTDOWN days for the timer's region). At most one RUNNING timer
 * per (funder, slaCode, subject) — a duplicate start is a no-op returning
 * the existing timer, so at-least-once Kafka delivery is naturally safe.
 */
@Entity('sla_timer')
@Index('idx_sla_timer_due', ['status', 'deadlineAt'])
export class SlaTimer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  funderOrganizationId: number;

  @Column({ type: 'integer' })
  slaTemplateId: number;

  @ManyToOne(() => SlaTemplate, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'slaTemplateId' })
  slaTemplate: SlaTemplate;

  @Column({ type: 'varchar', length: 60 })
  slaCode: string;

  @Column({ type: 'varchar', length: 40 })
  subjectType: string;

  @Column({ type: 'varchar', length: 60 })
  subjectId: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  region: string | null;

  @Column({ type: 'timestamp' })
  startedAt: Date;

  @Column({ type: 'timestamp' })
  deadlineAt: Date;

  @Column({ type: 'varchar', default: SlaTimerStatusEnum.RUNNING })
  status: SlaTimerStatusEnum;

  @Column({ type: 'timestamp', nullable: true })
  breachedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  resolveReason: string | null;

  @Column({ type: 'varchar', nullable: true })
  notifyEmail: string | null;

  @Column({ type: 'jsonb', nullable: true })
  context: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'LOCALTIMESTAMP' })
  createdAt: Date;
}
