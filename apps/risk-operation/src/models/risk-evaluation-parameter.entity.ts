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
import { RiskEvalScoreTypeEnum } from '@app/common/apps/risk-operation/enums/risk-eval-score-type.enum';
import { RiskFactor } from './risk-factor.entity';
import { RiskFactorScoring } from './risk-factor-scoring.entity';
import { RiskCategoryEnum } from '@app/common/apps/risk-operation/enums/risk-category.enum';

@Entity()
export class RiskEvaluationParameter extends AbstractEntity<RiskEvaluationParameter> {
  // ------------------ Relationship ------------------

  @Column({ type: 'int', nullable: true })
  riskFactorId?: number;

  @ManyToOne(
    () => RiskFactor,
    (riskFactor) => riskFactor.riskEvaluationParameters,
  )
  @JoinColumn({ name: 'riskFactorId' })
  riskFactor?: RiskFactor;

  @OneToMany(
    () => RiskFactorScoring,
    (scoring) => scoring.selectedEvaluationParam,
    {
      cascade: true,
    },
  )
  riskFactorScorings: RiskFactorScoring[];

  // ------------------ Relationship ------------------

  @Column({ type: 'integer', nullable: true })
  parentId: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string;

  @Column({ type: 'numeric', nullable: true })
  weight: number;

  @Column({
    type: 'enum',
    enum: RiskCategoryEnum,
    enumName: 'RiskCategoryEnum_RiskEvaluationParam',
    nullable: true,
  })
  riskCategory: RiskCategoryEnum;

  @Column({
    type: 'enum',
    enum: RiskEvalScoreTypeEnum,
    enumName: 'RiskEvalScoreTypeEnum',
    nullable: true,
  })
  scoreType: RiskEvalScoreTypeEnum;

  @Column({ type: 'integer', nullable: true })
  fixedScore: number;

  @Column({ type: 'integer', nullable: true })
  scoreRangeMin: number;

  @Column({ type: 'integer', nullable: true })
  scoreRangeMax: number;

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
