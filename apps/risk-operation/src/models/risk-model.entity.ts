import { RiskModelStatusEnum } from '@app/common/apps/risk-operation/enums/risk-model-status.enum';
import { AbstractEntity } from '@app/common/database/abstract.entity';
import { NumericTransformer } from '@app/common/utils/numeric-transformer';
import { rangeTransformer } from '@app/common/utils/range-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { RiskHighClassificationFactor } from './risk-high-classification-factor.entity';
import { RiskFactor } from './risk-factor.entity';
import { RiskApplicationScoring } from './risk-application-scoring.entity';

@Entity()
export class RiskModel extends AbstractEntity<RiskModel> {
  // ------------------ Relationship ------------------

  @OneToMany(() => RiskFactor, (factor) => factor.riskModel, {
    cascade: true,
    // eager: true,
  })
  riskFactors: RiskFactor[];

  @OneToMany(() => RiskHighClassificationFactor, (factor) => factor.riskModel, {
    cascade: true,
    // eager: true,
  })
  riskHighClassificationFactors: RiskHighClassificationFactor[];

  @OneToMany(() => RiskApplicationScoring, (scoring) => scoring.riskModel, {
    cascade: true,
  })
  riskApplicationScorings: RiskApplicationScoring[];

  // ------------------ Relationship ------------------

  @Column({
    type: 'enum',
    enum: RiskModelStatusEnum,
    enumName: 'RiskModelStatusEnum',
  })
  riskModelStatus: RiskModelStatusEnum;

  @Column({ type: 'varchar', unique: true })
  riskModelNumber: string;

  // Name uniqueness is per funder since CRC pass 1 (DB index
  // uq_risk_model_funder_name), no longer global.
  @Column({ type: 'varchar' })
  riskModelName: string;

  // ------------------ CRC pass 1 (2026-07-24) ------------------

  /** Tenant scope — caller's JWT orgId (bare trade-directory org id). */
  @Column({ type: 'integer' })
  funderOrganizationId: number;

  /** SIMPLE_WEIGHTED (flat factors) | MULTI_FACTOR (factor>category>sub). */
  @Column({ type: 'varchar', default: 'MULTI_FACTOR' })
  modelShape: string;

  @Column({ type: 'integer', nullable: true })
  createdByPersonId?: number;

  @Column({ type: 'integer', nullable: true })
  checkedByPersonId?: number;

  @Column({ type: 'integer', nullable: true })
  publishedByPersonId?: number;

  @Column({ type: 'timestamp without time zone', nullable: true })
  submittedAt?: Date;

  @Column({ type: 'timestamp without time zone', nullable: true })
  checkedAt?: Date;

  @Column({ type: 'timestamp without time zone', nullable: true })
  publishedAt?: Date;

  // ------------------ CRC pass 1 ------------------

  @Column({ type: 'varchar', nullable: true })
  description?: string;

  @Column({
    type: 'integer',
    default: 0,
  })
  numberOfActiveProfiles: number;

  @Column({
    type: 'numrange',
    transformer: rangeTransformer,
  })
  lowRiskThresholds: [number, number];

  @Column({
    type: 'numrange',
    transformer: rangeTransformer,
  })
  mediumRiskThresholds: [number, number];

  @Column({
    type: 'numrange',
    transformer: rangeTransformer,
  })
  highRiskThresholds: [number, number];

  @CreateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
    onUpdate: 'LOCALTIMESTAMP',
  })
  updatedAt: Date;
}
