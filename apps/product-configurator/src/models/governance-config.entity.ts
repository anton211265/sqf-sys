import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export enum SlaWindowUnitEnum {
  HOURS = 'HOURS',
  DAYS = 'DAYS',
  WORKING_DAYS = 'WORKING_DAYS',
}

/**
 * SLA timer templates (agreed review remedy): every Section-1 process SLA
 * (applicant reminders, offer windows, CM approval…) is a row here, not a
 * hardcoded cron. The shared SLA engine that fires these is a later build —
 * this is its configuration source.
 */
@Entity('sla_template')
@Unique('UQ_sla_funder_code', ['funderOrganizationId', 'slaCode'])
export class SlaTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  funderOrganizationId: number;

  @Column({ type: 'varchar', length: 60 })
  slaCode: string;

  @Column({ type: 'varchar', length: 150 })
  slaName: string;

  @Column({ type: 'integer' })
  windowValue: number;

  @Column({ type: 'varchar', default: SlaWindowUnitEnum.WORKING_DAYS })
  windowUnit: SlaWindowUnitEnum;

  @Column({ type: 'varchar', length: 200 })
  breachAction: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'LOCALTIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'LOCALTIMESTAMP' })
  updatedAt: Date;
}

export enum ApprovalModeEnum {
  SEQUENTIAL = 'SEQUENTIAL',
  PARALLEL = 'PARALLEL',
}

/**
 * Executive approval matrix (agreed review remedy): quorum/threshold rules
 * read by the Product Fulfillment executive gate when that flow is built.
 * thresholdAmount null = the default rule for the scope; otherwise the rule
 * applies to amounts >= threshold (most-specific wins, resolved code-side).
 */
@Entity('approval_matrix_rule')
export class ApprovalMatrixRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  funderOrganizationId: number;

  @Column({ type: 'varchar', length: 60 })
  scope: string;

  @Column({ type: 'numeric', precision: 15, scale: 2, nullable: true })
  thresholdAmount: string | null;

  @Column({ type: 'integer', default: 1 })
  requiredApprovals: number;

  @Column({ type: 'varchar', default: ApprovalModeEnum.SEQUENTIAL })
  mode: ApprovalModeEnum;

  @Column({ type: 'varchar', length: 200, nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'LOCALTIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'LOCALTIMESTAMP' })
  updatedAt: Date;
}

export enum RiskBandEnum {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

/**
 * Credit-limit assignment ranges by product and risk band — read by CRC
 * credit-limit assignment. Band names follow the risk-band ruling (HIGH
 * score = LOW risk; the band label here is the RISK, not the score).
 */
@Entity('credit_limit_range')
@Unique('UQ_range_funder_product_band', [
  'funderOrganizationId',
  'productCode',
  'riskBand',
])
export class CreditLimitRange {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  funderOrganizationId: number;

  @Column({ type: 'varchar', length: 10 })
  productCode: string;

  @Column({ type: 'varchar' })
  riskBand: RiskBandEnum;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  minLimit: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  maxLimit: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'LOCALTIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'LOCALTIMESTAMP' })
  updatedAt: Date;
}
