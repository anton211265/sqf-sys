import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum LeadStatusEnum {
  LEAD = 'LEAD', // unqualified
  PROSPECT = 'PROSPECT', // qualified
  PROMOTED = 'PROMOTED', // handed to onboarding (applicant shell)
  CLOSED = 'CLOSED',
}

/**
 * Funnel head: LEAD → PROSPECT → PROMOTED (applicant) → (Customer Portal /
 * CRC take over). organizationId links the lead to a trade-directory
 * organization once one exists (bare reference, no cross-DB FK).
 */
@Entity('lead')
@Index('idx_lead_owner', ['funderOrganizationId', 'ownerRmPersonId', 'status'])
export class Lead {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  funderOrganizationId: number;

  @Column({ type: 'varchar', length: 255 })
  companyName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  registrationNumber: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  contactName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactEmail: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  contactPhone: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  source: string | null;

  @Column({ type: 'varchar', default: LeadStatusEnum.LEAD })
  status: LeadStatusEnum;

  @Column({ type: 'integer' })
  ownerRmPersonId: number;

  @Column({ type: 'integer', nullable: true })
  organizationId: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'timestamp', nullable: true })
  qualifiedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  promotedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'LOCALTIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'LOCALTIMESTAMP' })
  updatedAt: Date;
}

export enum DealStageEnum {
  QUALIFIED = 'QUALIFIED',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  WON = 'WON',
  LOST = 'LOST',
}

/** Kanban stages per the approved annotation (decision 1). */
@Entity('deal')
@Index('idx_deal_owner', ['funderOrganizationId', 'ownerRmPersonId', 'stage'])
export class Deal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  funderOrganizationId: number;

  @Column({ type: 'integer' })
  leadId: number;

  @ManyToOne(() => Lead, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leadId' })
  lead: Lead;

  @Column({ type: 'integer' })
  ownerRmPersonId: number;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  productCode: string | null;

  @Column({ type: 'numeric', precision: 15, scale: 2, nullable: true })
  dealValue: string | null;

  @Column({ type: 'date', nullable: true })
  expectedCloseDate: string | null;

  @Column({ type: 'varchar', default: DealStageEnum.QUALIFIED })
  stage: DealStageEnum;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'LOCALTIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'LOCALTIMESTAMP' })
  updatedAt: Date;
}

/** Append-only stage moves — conversion analytics and the deal's audit trail. */
@Entity('deal_stage_history')
export class DealStageHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  dealId: number;

  @ManyToOne(() => Deal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dealId' })
  deal: Deal;

  @Column({ type: 'varchar', nullable: true })
  fromStage: DealStageEnum | null;

  @Column({ type: 'varchar' })
  toStage: DealStageEnum;

  @Column({ type: 'integer' })
  movedByPersonId: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'LOCALTIMESTAMP' })
  movedAt: Date;
}

/** RM assessment output (blueprint: RM Dashboard → Assessment). */
@Entity('site_visit_report')
export class SiteVisitReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  funderOrganizationId: number;

  @Column({ type: 'integer', nullable: true })
  leadId: number | null;

  @Column({ type: 'integer', nullable: true })
  organizationId: number | null;

  @Column({ type: 'date' })
  visitedAt: string;

  @Column({ type: 'varchar', length: 300 })
  summary: string;

  @Column({ type: 'text', nullable: true })
  findings: string | null;

  @Column({ type: 'integer' })
  reportedByPersonId: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'LOCALTIMESTAMP' })
  createdAt: Date;
}
