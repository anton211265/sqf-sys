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

  @Column({ type: 'varchar', unique: true })
  riskModelName: string;

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
