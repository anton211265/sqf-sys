import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export enum DayCountConventionEnum {
  ACT_360 = 'ACT_360',
  ACT_365 = 'ACT_365',
  THIRTY_360 = 'THIRTY_360',
}

export enum RolloverRuleEnum {
  MODIFIED_FOLLOWING = 'MODIFIED_FOLLOWING',
  PRECEDING = 'PRECEDING',
}

export enum BankCountryMatchModeEnum {
  HARD_BLOCK = 'HARD_BLOCK',
  FLAG_ONLY = 'FLAG_ONLY',
}

export enum CorporateEmailModeEnum {
  BLOCK = 'BLOCK',
  FLAG_ONLY = 'FLAG_ONLY',
}

/**
 * Per-funder singleton (auto-created on first read). One row, three
 * differently-guarded slices: dayCountConvention + penaltyMarginPct are
 * edited under config_billing_manage, rolloverRule under
 * config_calendar_manage, bankCountryMatchMode + corporateEmailMode under
 * config_policies_manage — each service PATCHes only its own columns.
 * penaltyMarginPct is a fraction (0.03 = +3.00% over the base index).
 */
@Entity('funder_config_settings')
@Unique(['funderOrganizationId'])
export class FunderConfigSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  funderOrganizationId: number;

  @Column({ type: 'varchar', default: DayCountConventionEnum.ACT_365 })
  dayCountConvention: DayCountConventionEnum;

  @Column({ type: 'numeric', precision: 5, scale: 4, default: 0 })
  penaltyMarginPct: string;

  @Column({ type: 'varchar', default: RolloverRuleEnum.MODIFIED_FOLLOWING })
  rolloverRule: RolloverRuleEnum;

  @Column({ type: 'varchar', default: BankCountryMatchModeEnum.HARD_BLOCK })
  bankCountryMatchMode: BankCountryMatchModeEnum;

  @Column({ type: 'varchar', default: CorporateEmailModeEnum.BLOCK })
  corporateEmailMode: CorporateEmailModeEnum;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'LOCALTIMESTAMP' })
  updatedAt: Date;
}
