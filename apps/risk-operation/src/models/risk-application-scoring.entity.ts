import { RiskCategoryEnum } from '@app/common/apps/risk-operation/enums/risk-category.enum';
import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  UpdateDateColumn,
} from 'typeorm';
import { Application } from './application.entity';
import { RiskModel } from './risk-model.entity';
import { RiskFactorScoring } from './risk-factor-scoring.entity';
import { RiskHighClassificationScoring } from './risk-high-classification-scoring.entity';
import { RiskQuantitativeProfileScoring } from './risk-quantitative-profile-scoring.entity';
import { RiskApplicationAuditLog } from './risk-application-audit-log.entity';
import { RiskManualReviewAlert } from './risk-manual-review-alert.entity';
import { RiskProfile } from './risk-profile.entity';
import { RiskFilter1StatusEnum } from '@app/common/apps/risk-operation/enums/risk-filter-1-status.enum';

@Entity()
export class RiskApplicationScoring extends AbstractEntity<RiskApplicationScoring> {
  // ------------------ Relationship ------------------

  @OneToOne(
    () => Application,
    (application) => application.riskApplicationScoring,
  )
  @JoinColumn({ name: 'applicationId' })
  application?: Application;

  @ManyToOne(() => RiskModel, (riskModel) => riskModel.riskApplicationScorings)
  @JoinColumn({ name: 'riskModelId' })
  riskModel?: RiskModel;

  @OneToMany(
    () => RiskFactorScoring,
    (factorScoring) => factorScoring.riskApplicationScoring,
    {
      cascade: true,
      eager: true,
    },
  )
  riskFactorScorings: RiskFactorScoring[];

  @OneToMany(
    () => RiskHighClassificationScoring,
    (highScoring) => highScoring.riskApplicationScoring,
    {
      cascade: true,
      eager: true,
    },
  )
  riskHighClassificationScorings: RiskHighClassificationScoring[];

  @OneToMany(
    () => RiskQuantitativeProfileScoring,
    (scoring) => scoring.riskApplicationScoring,
    { cascade: false },
  )
  quantitativeProfileScorings: RiskQuantitativeProfileScoring[];

  @OneToMany(
    () => RiskApplicationAuditLog,
    (log) => log.riskApplicationScoring,
    { cascade: true },
  )
  auditLogs: RiskApplicationAuditLog[];

  @OneToMany(
    () => RiskManualReviewAlert,
    (alert) => alert.riskApplicationScoring,
    { cascade: true, eager: true },
  )
  manualReviewAlerts: RiskManualReviewAlert[];

  @ManyToOne(() => RiskProfile, (profile) => profile.applicationScorings, {
    // eager: true,
  })
  @JoinColumn({ name: 'risk_profile_id' }) // FK column in this table
  riskProfile: RiskProfile;

  // ------------------ Relationship ------------------

  @Column({ type: 'int', nullable: true })
  applicationId?: number;

  @Column({ name: 'risk_profile_id', type: 'int', nullable: true })
  riskProfileId: number;

  @Column({ type: 'int', nullable: true })
  riskModelId?: number;

  @Column({ type: 'integer', nullable: true })
  isRiskSurveyCompleted: number;

  @Column({
    name: 'risk_filter_1_total_score',
    type: 'numeric',
    nullable: true,
  })
  riskFilter1TotalScore: number;

  @Column({
    name: 'risk_filter_1_category',
    type: 'enum',
    enum: RiskCategoryEnum,
    enumName: 'RiskCategoryEnum_Filter1', // Give this enum a unique name in Postgres bcos using the same enumName ('RiskCategoryEnum') across multiple columns can cause TypeORM to attempt a DROP and recreate of the shared enum type
    nullable: true,
  })
  riskFilter1Category: RiskCategoryEnum;

  @Column({
    name: 'risk_filter_1_status',
    type: 'enum',
    enum: RiskFilter1StatusEnum,
    enumName: 'RiskFilter1StatusEnum',
    nullable: true,
  })
  riskFilter1Status: RiskFilter1StatusEnum;

  @UpdateDateColumn({
    name: 'risk_filter_1_updated_at',
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
    onUpdate: 'LOCALTIMESTAMP',
  })
  riskFilter1UpdatedAt: Date;

  @Column({
    name: 'risk_filter_2_total_score',
    type: 'numeric',
    nullable: true,
  })
  riskFilter2TotalScore: number;

  @Column({
    name: 'risk_filter_2_category',
    type: 'enum',
    enum: RiskCategoryEnum,
    enumName: 'RiskCategoryEnum_Filter2',
    nullable: true,
  })
  riskFilter2Category: RiskCategoryEnum;

  @UpdateDateColumn({
    name: 'risk_filter_2_updated_at',
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
    onUpdate: 'LOCALTIMESTAMP',
  })
  riskFilter2UpdatedAt: Date;

  @Column({ type: 'integer', nullable: true })
  isSubmittedForSettlement: number;

  @Column({ type: 'integer', nullable: true })
  isAuthorizationRequired: number;

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
