import { AbstractEntity } from '@app/common/database/abstract.entity';
import { Column, CreateDateColumn, Entity, UpdateDateColumn } from 'typeorm';
import { OneToMany } from 'typeorm';
import { RiskQuantitativeSubParameter } from './risk-quantitative-sub-parameter.entity';
import { RiskQuantitativeProfileWeight } from './risk-quantitative-profile-weight.entity';
import { RiskQuantitativeThresholdRule } from './risk-quantitative-threshold-rule.entity';
import { RiskQuantitativeProfileScoring } from './risk-quantitative-profile-scoring.entity';
import { RiskManualReviewAlert } from './risk-manual-review-alert.entity';

@Entity()
export class RiskQuantitativeParameter extends AbstractEntity<RiskQuantitativeParameter> {
  // ------------------ Relationship ------------------

  @OneToMany(
    () => RiskQuantitativeSubParameter,
    (subParameter) => subParameter.quantitativeParameter,
    { cascade: true, eager: true }, // When you save or remove the parent entity, it automatically applies those actions to its related child entities.
  )
  riskQuantitativeSubParameters: RiskQuantitativeSubParameter[];

  @OneToMany(
    () => RiskQuantitativeProfileWeight,
    (profileWeight) => profileWeight.quantitativeParameter,
    { cascade: true },
  )
  riskQuantitativeProfileWeights: RiskQuantitativeProfileWeight[];

  @OneToMany(
    () => RiskQuantitativeThresholdRule,
    (rule) => rule.quantitativeParameter,
  )
  riskQuantitativeThresholdRules: RiskQuantitativeThresholdRule[];

  @OneToMany(
    () => RiskQuantitativeProfileScoring,
    (scoring) => scoring.quantitativeParameter,
  )
  quantitativeProfileScorings: RiskQuantitativeProfileScoring[];

  @OneToMany(
    () => RiskManualReviewAlert,
    (alert) => alert.quantitativeParameter,
  )
  manualReviewAlerts: RiskManualReviewAlert[];

  // ------------------ Relationship ------------------

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
