import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Append-only Filter-2 assessment instance (CRC pass 1, 2026-07-24).
 * Subject = a client organization (bare trade-directory organizationId int
 * per the house cross-service rule). The full model structure is
 * SNAPSHOTTED per assessment so later edits/republishes never mutate past
 * results. Scores are risk-points orientation: high score = HIGH risk
 * (opposite of Filter-1 — every screen labels the band, per Tony's ruling).
 */
@Entity('risk_assessment')
export class RiskAssessment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'funder_organization_id', type: 'integer' })
  funderOrganizationId: number;

  @Column({ name: 'organization_id', type: 'integer' })
  organizationId: number;

  @Column({ name: 'organization_name', type: 'varchar', nullable: true })
  organizationName: string | null;

  @Column({ name: 'risk_model_id', type: 'integer' })
  riskModelId: number;

  @Column({ name: 'risk_model_number', type: 'varchar' })
  riskModelNumber: string;

  @Column({ name: 'risk_model_name', type: 'varchar' })
  riskModelName: string;

  @Column({ name: 'model_snapshot', type: 'jsonb' })
  modelSnapshot: Record<string, any>;

  @Column({ name: 'total_score', type: 'numeric' })
  totalScore: string;

  @Column({ type: 'varchar' })
  classification: string;

  @Column({ name: 'override_tripped', type: 'boolean', default: false })
  overrideTripped: boolean;

  @Column({ name: 'override_factors', type: 'jsonb', nullable: true })
  overrideFactors: string[] | null;

  @Column({ type: 'jsonb' })
  breakdown: Record<string, any>;

  @Column({ name: 'conducted_by_person_id', type: 'integer' })
  conductedByPersonId: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
  })
  createdAt: Date;

  @OneToMany(() => RiskAssessmentAnswer, (answer) => answer.riskAssessment, {
    cascade: true,
  })
  answers: RiskAssessmentAnswer[];
}

@Entity('risk_assessment_answer')
export class RiskAssessmentAnswer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'risk_assessment_id', type: 'integer' })
  riskAssessmentId: number;

  @ManyToOne(() => RiskAssessment, (assessment) => assessment.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'risk_assessment_id' })
  riskAssessment: RiskAssessment;

  /** Stable structural key, e.g. "f0", "f1.c0.s2" (factor.category.sub). */
  @Column({ name: 'node_key', type: 'varchar' })
  nodeKey: string;

  @Column({ name: 'node_name', type: 'varchar' })
  nodeName: string;

  @Column({ name: 'raw_value', type: 'jsonb', nullable: true })
  rawValue: any;

  @Column({ type: 'numeric', nullable: true })
  points: string | null;

  @Column({ type: 'numeric', nullable: true })
  normalized: string | null;

  @Column({ name: 'weighted_contribution', type: 'numeric', nullable: true })
  weightedContribution: string | null;
}
