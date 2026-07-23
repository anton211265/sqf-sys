import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Product } from './product.entity';

export enum RateCardStatusEnum {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum FormulaTypeEnum {
  COMPOUND_DAILY = 'COMPOUND_DAILY',
  SIMPLE_INTEREST = 'SIMPLE_INTEREST',
  TIERED_DISCOUNT = 'TIERED_DISCOUNT',
}

/**
 * Master rate card versions (spec §3 "master_rate_cards" + the blueprint's
 * "Master Template Version Controller"). status/publishedAt are additions to
 * the spec: publishing is a distinct governed action
 * (config_rate_cards_publish) and exactly one version per product is
 * PUBLISHED at a time — publishing archives the previous one. Drafts are the
 * only editable state. Rates are fractions (0.0850 = 8.5%), per the spec's
 * JSON schema.
 */
@Entity('master_rate_card')
@Unique('unique_product_version', ['productId', 'versionNumber'])
export class MasterRateCard {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  productId: number;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'integer', default: 1 })
  versionNumber: number;

  @Column({ type: 'varchar', default: RateCardStatusEnum.DRAFT })
  status: RateCardStatusEnum;

  @Column({ type: 'integer', default: 30 })
  minTenureDays: number;

  @Column({ type: 'integer', default: 360 })
  maxTenureDays: number;

  @Column({ type: 'numeric', precision: 5, scale: 4, nullable: true })
  interestRateApr: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 4, nullable: true })
  advanceRatePct: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 4, nullable: true })
  discountFeePct: string | null;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  oneTimeAdminFee: string;

  @Column({ type: 'numeric', precision: 5, scale: 4, default: 0 })
  reserveRetainPct: string;

  @Column({ type: 'varchar', nullable: true })
  formulaType: FormulaTypeEnum | null;

  @Column({ type: 'jsonb', nullable: true })
  customVariables: { key: string; value: string }[] | null;

  @Column({ type: 'boolean', default: false })
  configuredByAgent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'LOCALTIMESTAMP' })
  createdAt: Date;
}
