import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export enum RateUpdateModeEnum {
  MANUAL = 'MANUAL',
  API = 'API',
}

/** Base rate indices (SOFR/SONIA/…) — Interest & Accrual Matrix. Rates are
 * fractions (0.0531 = 5.31%), same convention as rate cards. */
@Entity('base_rate_index')
@Unique('UQ_rate_index_funder_code', ['funderOrganizationId', 'indexCode'])
export class BaseRateIndex {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  funderOrganizationId: number;

  @Column({ type: 'varchar', length: 20 })
  indexCode: string;

  @Column({ type: 'numeric', precision: 5, scale: 4 })
  ratePct: string;

  @Column({ type: 'varchar', default: RateUpdateModeEnum.MANUAL })
  updateMode: RateUpdateModeEnum;

  @CreateDateColumn({ type: 'timestamp', default: () => 'LOCALTIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'LOCALTIMESTAMP' })
  updatedAt: Date;
}

export enum ChargeBasisEnum {
  TRANSACTION = 'TRANSACTION',
  AUDIT = 'AUDIT',
  CHECK = 'CHECK',
  MONTH = 'MONTH',
}

export enum DeductionRuleEnum {
  AT_DISBURSEMENT = 'AT_DISBURSEMENT',
  MONTHLY_INVOICE = 'MONTHLY_INVOICE',
}

/** Service Charge Matrix — Fee Schedules & Realization Controls. */
@Entity('fee_schedule')
@Unique('UQ_fee_funder_code', ['funderOrganizationId', 'feeCode'])
export class FeeSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  funderOrganizationId: number;

  @Column({ type: 'varchar', length: 40 })
  feeCode: string;

  @Column({ type: 'varchar', length: 150 })
  feeName: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  amount: string;

  @Column({ type: 'varchar', default: ChargeBasisEnum.TRANSACTION })
  chargeBasis: ChargeBasisEnum;

  @Column({ type: 'varchar', default: DeductionRuleEnum.AT_DISBURSEMENT })
  deductionRule: DeductionRuleEnum;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'LOCALTIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'LOCALTIMESTAMP' })
  updatedAt: Date;
}
