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
import { RiskHighClassificationScoring } from './risk-high-classification-scoring.entity';

@Entity()
export class RiskHighClassificationFactor extends AbstractEntity<RiskHighClassificationFactor> {
  // ------------------ Relationship ------------------

  @Column({ type: 'int', nullable: true })
  riskModelId?: number;

  @ManyToOne(
    () => RiskModel,
    (riskModel) => riskModel.riskHighClassificationFactors,
  )
  @JoinColumn({ name: 'riskModelId' })
  riskModel?: RiskModel;

  @OneToMany(
    () => RiskHighClassificationScoring,
    (highScoring) => highScoring.riskHighClassificationFactor,
    {
      cascade: true,
    },
  )
  riskHighClassificationScorings: RiskHighClassificationScoring[];

  // ------------------ Relationship ------------------

  @Column({ type: 'varchar' })
  riskFactor: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string;

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
