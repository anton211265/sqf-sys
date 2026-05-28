import { RiskCategoryEnum } from '@app/common/apps/risk-operation/enums/risk-category.enum';
import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { Application } from './application.entity';
import { RiskModel } from './risk-model.entity';
import { RiskFactor } from './risk-factor.entity';
import { RiskEvaluationParameter } from './risk-evaluation-parameter.entity';
import { RiskApplicationScoring } from './risk-application-scoring.entity';

@Entity()
export class RiskFactorScoring extends AbstractEntity<RiskFactorScoring> {
  // ------------------ Relationship ------------------

  @Column({ type: 'int' })
  riskApplicationScoringId: number;

  @ManyToOne(
    () => RiskApplicationScoring,
    (applicationScoring) => applicationScoring.riskFactorScorings,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'riskApplicationScoringId' })
  riskApplicationScoring!: RiskApplicationScoring;

  @Column({ type: 'int' })
  riskFactorId: number;

  @ManyToOne(() => RiskFactor, (riskFactor) => riskFactor.riskFactorScorings)
  @JoinColumn({ name: 'riskFactorId' })
  riskFactor!: RiskFactor;

  @Column({ type: 'int', nullable: true })
  selectedEvaluationParamId!: number;

  @ManyToOne(
    () => RiskEvaluationParameter,
    (param) => param.riskFactorScorings,
    {
      nullable: true,
    },
  )
  @JoinColumn({ name: 'selectedEvaluationParamId' })
  selectedEvaluationParam?: RiskEvaluationParameter;

  // ------------------ Parent-Child Relationship (Self-referencing) ------------------
  @ManyToOne(() => RiskFactorScoring, (factor) => factor.subFactors, {
    nullable: true,
  })
  @JoinColumn({ name: 'parentId' })
  parentFactor?: RiskFactorScoring;

  // ------------------ Parent-Child Relationship (Self-referencing) ------------------
  @OneToMany(() => RiskFactorScoring, (factor) => factor.parentFactor)
  subFactors: RiskFactorScoring[]; // Add this property explicitly

  // ------------------ Relationship ------------------

  @Column({ type: 'varchar', nullable: true })
  riskFactorName: string;

  @Column({ type: 'integer', nullable: true })
  parentId: number;

  @Column({ type: 'varchar', nullable: true })
  selectedCountry: string;

  @Column({ type: 'numeric', nullable: true })
  score: number;

  @Column({ type: 'numeric', nullable: true })
  weight: number;

  @Column({ type: 'integer', nullable: true })
  scoreRangeMax: number;

  @Column({ type: 'int', nullable: true })
  scoreRangeMin: number;

  @Column({ type: 'integer', nullable: true })
  isAQuestion: number;

  @Column({ type: 'numeric', nullable: true })
  totalSubFactorScore: number;

  @Column({ type: 'float', nullable: true })
  factorScore: number;

  @Column({ type: 'float', nullable: true })
  weightedFactorScore: number;

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
