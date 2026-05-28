import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { RiskQuantitativeParameter } from './risk-quantitative-parameter.entity';
import { RiskQuantitativeProfileWeight } from './risk-quantitative-profile-weight.entity';
import { NumericTransformer } from '@app/common/utils/numeric-transformer';
import { ThresholdBreachTriggerComparisonOperatorEnum } from '@app/common/apps/risk-operation/enums/threshold-breach-trigger-comparison-operator.enum';
import { RiskProfile } from './risk-profile.entity';
import { RiskQuantitativeSubParameter } from './risk-quantitative-sub-parameter.entity';
import { RiskQuantitativeProfileScoring } from './risk-quantitative-profile-scoring.entity';
import { RiskManualReviewAlert } from './risk-manual-review-alert.entity';

@Entity()
export class RiskQuantitativeThresholdRule extends AbstractEntity<RiskQuantitativeThresholdRule> {
  // ------------------ Relationship ------------------

  @ManyToOne(
    () => RiskProfile,
    (profile) => profile.riskQuantitativeThresholdRules,
    {
      onDelete: 'CASCADE', // When profile is deleted, also delete threshold rule
    },
  )
  @JoinColumn({ name: 'risk_profile_id' })
  riskProfile: RiskProfile;

  @ManyToOne(() => RiskQuantitativeParameter, {
    eager: true,
  })
  @JoinColumn({ name: 'quantitative_parameter_id' })
  quantitativeParameter: RiskQuantitativeParameter;

  @ManyToOne(() => RiskQuantitativeSubParameter, {
    eager: true,
  })
  @JoinColumn({ name: 'quantitative_sub_parameter_id' })
  quantitativeSubParameter: RiskQuantitativeSubParameter;

  @OneToMany(
    () => RiskQuantitativeProfileScoring,
    (scoring) => scoring.thresholdRule,
  )
  quantitativeProfileScorings: RiskQuantitativeProfileScoring[];

  @OneToMany(() => RiskManualReviewAlert, (alert) => alert.thresholdRule)
  manualReviewAlerts: RiskManualReviewAlert[];

  // ------------------ Relationship ------------------

  @Column({ name: 'risk_profile_id', type: 'int' })
  riskProfileId: number;

  @Column({ name: 'quantitative_parameter_id', type: 'int' })
  quantitativeParameterId: number;

  @Column({ name: 'quantitative_sub_parameter_id', type: 'int' })
  quantitativeSubParameterId: number;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(), // because PostgreSQL stores numeric and decimal fields as strings. Without this transformer, TypeORM will give you back a string, not a number.
  })
  score: number;

  @Column({
    name: 'threshold_value',
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  thresholdValue: number;

  @Column({
    name: 'threshold_label',
    type: 'varchar',
    nullable: true,
  })
  thresholdLabel: string;

  @Column({
    name: 'comparison_operator',
    type: 'enum',
    enum: ThresholdBreachTriggerComparisonOperatorEnum,
    enumName: 'ThresholdBreachTriggerComparisonOperatorEnum',
  })
  comparisonOperator: ThresholdBreachTriggerComparisonOperatorEnum;

  @Column({ name: 'is_manual_trigger_allowed', type: 'integer', default: 0 })
  isManualTriggerAllowed: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
    onUpdate: 'LOCALTIMESTAMP',
  })
  updatedAt: Date;
}
