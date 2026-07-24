import { RiskFactorScoreMethodEnum } from '@app/common/apps/risk-operation/enums/risk-factor-score-method.enum';
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
import { RiskModel } from './risk-model.entity';
import { RiskEvaluationParameter } from './risk-evaluation-parameter.entity';
import { RiskFactorScoring } from './risk-factor-scoring.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class RiskFactor extends AbstractEntity<RiskFactor> {
  // ------------------ Relationship ------------------

  @Column({ type: 'int', nullable: true })
  riskModelId?: number;

  @ManyToOne(() => RiskModel, (riskModel) => riskModel.riskFactors)
  @JoinColumn({ name: 'riskModelId' })
  riskModel?: RiskModel;

  @OneToMany(() => RiskEvaluationParameter, (riskEval) => riskEval.riskFactor, {
    cascade: true,
    // eager: true,
  })
  riskEvaluationParameters: RiskEvaluationParameter[];

  @OneToMany(() => RiskFactorScoring, (scoring) => scoring.riskFactor, {
    cascade: true,
  })
  riskFactorScorings: RiskFactorScoring[];

  // ------------------ Relationship ------------------

  @Column({ type: 'integer', nullable: true })
  parentId: number;

  @Column({ type: 'varchar' })
  riskFactorName: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string;

  @Column({ type: 'numeric', nullable: true })
  weight: number;

  @Column({ type: 'integer', default: 0 })
  isSetAsCategory: number;

  @Column({ type: 'integer', default: 0 })
  hasSubFactor: number;

  @Column({ type: 'varchar', nullable: true })
  tabName: string;

  @Column({
    type: 'enum',
    enum: RiskFactorScoreMethodEnum,
    enumName: 'RiskFactorScoreMethodEnum',
    nullable: true,
  })
  scoreMethod: RiskFactorScoreMethodEnum;

  @Column({ type: 'integer', default: 0 })
  isRequireEvaluationParameter: number;

  @Column({ type: 'integer', nullable: true })
  scoreRangeMin: number;

  @Column({ type: 'integer', nullable: true })
  scoreRangeMax: number;

  /**
   * CRC pass 1: per-node scoring-method configuration for all 8 methods
   * (labels/points/sub-scoring, dropdown options, conditions, boolean
   * scores, date rules, country rows). Shape validated in
   * scoring-engine.ts; the legacy countryList jsonb below is unused by v2.
   */
  @Column({ type: 'jsonb', nullable: true })
  scoringConfig?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  countryList?: {
    highRisk: { countryName: string; score: number }[];
    mediumRisk: { countryName: string; score: number }[];
    lowRisk: { countryName: string; score: number }[];
  };

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
