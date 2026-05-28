import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RiskApplicationScoring } from './risk-application-scoring.entity';
import { AbstractEntity } from '@app/common/database/abstract.entity';
import { RiskQuantitativeParameter } from './risk-quantitative-parameter.entity';
import { RiskQuantitativeSubParameter } from './risk-quantitative-sub-parameter.entity';
import { RiskQuantitativeThresholdRule } from './risk-quantitative-threshold-rule.entity';

@Entity({ name: 'risk_manual_review_alert' })
export class RiskManualReviewAlert extends AbstractEntity<RiskManualReviewAlert> {
  // ------------------ Relationship ------------------

  @ManyToOne(
    () => RiskApplicationScoring,
    (scoring) => scoring.manualReviewAlerts,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'risk_application_scoring_id' })
  riskApplicationScoring: RiskApplicationScoring;

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

  @ManyToOne(() => RiskQuantitativeThresholdRule, {
    eager: true,
  })
  @JoinColumn({ name: 'threshold_rule_id' })
  thresholdRule: RiskQuantitativeThresholdRule;

  // ------------------ Relationship ------------------

  @Column({ name: 'risk_application_scoring_id', type: 'integer' })
  riskApplicationScoringId: number;

  @Column({
    name: 'quantitative_parameter_id',
    type: 'integer',
    nullable: true,
  })
  quantitativeParameterId: number;

  @Column({
    name: 'quantitative_sub_parameter_id',
    type: 'integer',
    nullable: true,
  })
  quantitativeSubParameterId: number;

  @Column({ name: 'threshold_rule_id', type: 'integer', nullable: true })
  thresholdRuleId: number;

  @Column({ name: 'actual_value_numeric', type: 'numeric', nullable: true })
  actualValueNumeric: number;

  @Column({ name: 'actual_value_label', type: 'varchar', nullable: true })
  actualValueLabel: string;

  @Column({ type: 'varchar', nullable: true })
  message: string;

  @Column({ name: 'is_resolved', type: 'integer', default: 0 })
  isResolved: number;

  @Column({ name: 'is_resolved_by', type: 'varchar', nullable: true })
  isResolvedBy: string;

  @Column({
    name: 'is_resolved_at',
    type: 'timestamp without time zone',
    nullable: true,
  })
  isResolvedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp without time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp without time zone' })
  updatedAt: Date;
}
