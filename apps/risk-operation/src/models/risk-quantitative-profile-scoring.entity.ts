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
import { RiskQuantitativeThresholdRule } from './risk-quantitative-threshold-rule.entity';
import { NumericTransformer } from '@app/common/utils/numeric-transformer';
import { RiskApplicationScoring } from './risk-application-scoring.entity';
import { RiskQuantitativeSubParameter } from './risk-quantitative-sub-parameter.entity';

@Entity()
export class RiskQuantitativeProfileScoring extends AbstractEntity<RiskQuantitativeProfileScoring> {
  // ------------------ Relationship ------------------

  @ManyToOne(
    () => RiskApplicationScoring,
    (applicationScoring) => applicationScoring.quantitativeProfileScorings,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'risk_application_scoring_id' })
  riskApplicationScoring: RiskApplicationScoring;

  @ManyToOne(
    () => RiskQuantitativeParameter,
    (parameter) => parameter.quantitativeProfileScorings,
    { eager: true },
  )
  @JoinColumn({ name: 'quantitative_parameter_id' })
  quantitativeParameter: RiskQuantitativeParameter;

  // if some scorings are only for the main param
  @ManyToOne(
    () => RiskQuantitativeSubParameter,
    (subParameter) => subParameter.quantitativeProfileScorings,
    {
      // eager: true,
      nullable: true,
    },
  )
  @JoinColumn({ name: 'quantitative_sub_parameter_id' })
  quantitativeSubParameter: RiskQuantitativeSubParameter;

  @ManyToOne(
    () => RiskQuantitativeThresholdRule,
    (rule) => rule.quantitativeProfileScorings,
    { nullable: true },
  )
  @JoinColumn({ name: 'threshold_rule_id' })
  thresholdRule: RiskQuantitativeThresholdRule;

  // ------------------ Relationship ------------------

  @Column({ name: 'risk_application_scoring_id', type: 'int' })
  riskApplicationScoringId: number;

  @Column({ name: 'quantitative_parameter_id', type: 'int' })
  quantitativeParameterId: number;

  @Column({ name: 'quantitative_parameter_name', type: 'varchar' })
  quantitativeParameterName: string;

  @Column({
    name: 'quantitative_sub_parameter_id',
    type: 'int',
    nullable: true,
  })
  quantitativeSubParameterId: number;

  @Column({
    name: 'quantitative_sub_parameter_name',
    type: 'varchar',
    nullable: true,
  })
  quantitativeSubParameterName: number;

  @Column({ name: 'threshold_rule_id', type: 'int', nullable: true }) // Note: temperory nullable, fix later
  thresholdRuleId: number;

  @Column({
    name: 'value_numeric',
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  valueNumeric: number;

  @Column({
    name: 'value_label',
    type: 'varchar',
    nullable: true,
  })
  valueLabel: string;

  @Column({ name: 'weight', type: 'numeric' })
  weight: number;

  @Column({
    name: 'score',
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(), // because PostgreSQL stores numeric and decimal fields as strings. Without this transformer, TypeORM will give you back a string, not a number.
  })
  score: number;

  @Column({
    name: 'weighted_score',
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(), // because PostgreSQL stores numeric and decimal fields as strings. Without this transformer, TypeORM will give you back a string, not a number.
  })
  weightedScore: number;

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
