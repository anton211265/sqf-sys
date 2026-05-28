import { RiskCategoryEnum } from '@app/common/apps/risk-operation/enums/risk-category.enum';
import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { Application } from './application.entity';
import { RiskModel } from './risk-model.entity';
import { RiskFactor } from './risk-factor.entity';
import { RiskEvaluationParameter } from './risk-evaluation-parameter.entity';
import { RiskApplicationScoring } from './risk-application-scoring.entity';
import { RiskHighClassificationFactor } from './risk-high-classification-factor.entity';

@Entity()
export class RiskHighClassificationScoring extends AbstractEntity<RiskHighClassificationScoring> {
  // ------------------ Relationship ------------------

  @Column({ type: 'integer' })
  riskApplicationScoringId?: number;

  @ManyToOne(
    () => RiskApplicationScoring,
    (applicationScoring) => applicationScoring.riskHighClassificationScorings,
  )
  @JoinColumn({ name: 'riskApplicationScoringId' })
  riskApplicationScoring: RiskApplicationScoring;

  @Column({ type: 'integer' })
  riskHighClassificationFactorId?: number;

  @ManyToOne(
    () => RiskHighClassificationFactor,
    (highClassificationScoring) =>
      highClassificationScoring.riskHighClassificationScorings,
  )
  @JoinColumn({ name: 'riskHighClassificationFactorId' })
  riskHighClassificationFactor: RiskHighClassificationFactor;

  // ------------------ Relationship ------------------

  @Column({ type: 'integer', default: 0 })
  isSelected: number;

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
