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
import { RiskQuantitativeProfileScoring } from './risk-quantitative-profile-scoring.entity';
import { RiskManualReviewAlert } from './risk-manual-review-alert.entity';

@Entity()
export class RiskQuantitativeSubParameter extends AbstractEntity<RiskQuantitativeSubParameter> {
  // ------------------ Relationship ------------------

  @ManyToOne(
    () => RiskQuantitativeParameter,
    (quantitativeParameter) =>
      quantitativeParameter.riskQuantitativeSubParameters,
  )
  @JoinColumn({ name: 'quantitative_parameter_id' })
  quantitativeParameter: RiskQuantitativeParameter;

  @OneToMany(
    () => RiskQuantitativeProfileWeight,
    (profileWeight) => profileWeight.quantitativeSubParameter,
    { cascade: true },
  )
  riskQuantitativeProfileWeights: RiskQuantitativeProfileWeight[];

  @OneToMany(
    () => RiskQuantitativeThresholdRule,
    (rule) => rule.quantitativeSubParameter,
  )
  riskQuantitativeThresholdRules: RiskQuantitativeThresholdRule[];

  @OneToMany(
    () => RiskQuantitativeProfileScoring,
    (scoring) => scoring.quantitativeSubParameter,
  )
  quantitativeProfileScorings: RiskQuantitativeProfileScoring[];

  @OneToMany(
    () => RiskManualReviewAlert,
    (alert) => alert.quantitativeSubParameter,
  )
  manualReviewAlerts: RiskManualReviewAlert[];

  // ------------------ Relationship ------------------

  @Column({ name: 'quantitative_parameter_id', type: 'int' })
  quantitativeParameterId: number;

  @Column({ type: 'varchar' })
  name: string;

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
