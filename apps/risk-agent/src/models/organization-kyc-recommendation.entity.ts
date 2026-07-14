import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { RiskAgentHumanOutcomeEnum } from './risk-agent-recommendation.entity';

export enum OrganizationKycSourceEnum {
  INVOICE_ISSUER = 'invoice_issuer',
  INVOICE_DEBTOR = 'invoice_debtor',
}

export enum OrganizationKycOutcomeEnum {
  CLEAR = 'CLEAR',
  FLAGGED = 'FLAGGED',
}

/**
 * One row per KYC-intake review the Risk Agent runs on a bare, auto-created
 * Organization (see trade-directory's ORGANIZATION_CREATED event). Not the
 * same table as risk_agent_recommendation — that one is application-scoped
 * (NOT NULL applicationId/applicationNumber, no organizationId column at
 * all); this is organization-scoped and has no application in play yet.
 * humanOutcome/humanActorId close the audit loop the same way, via the CRC
 * dashboard.
 */
@Entity('organization_kyc_recommendation')
export class OrganizationKycRecommendation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'organization_id', type: 'integer' })
  organizationId: number;

  @Column({ name: 'organization_name', type: 'varchar' })
  organizationName: string;

  @Column({ name: 'business_registration_number', type: 'varchar', nullable: true })
  businessRegistrationNumber: string | null;

  @Column({ name: 'country', type: 'varchar' })
  country: string;

  @Column({
    name: 'source',
    type: 'enum',
    enum: OrganizationKycSourceEnum,
    enumName: 'OrganizationKycSourceEnum',
  })
  source: OrganizationKycSourceEnum;

  @Column({ name: 'funder_persona_id', type: 'integer' })
  funderPersonaId: number;

  @Column({
    name: 'outcome',
    type: 'enum',
    enum: OrganizationKycOutcomeEnum,
    enumName: 'OrganizationKycOutcomeEnum',
  })
  outcome: OrganizationKycOutcomeEnum;

  @Column({ name: 'confidence', type: 'numeric' })
  confidence: number;

  @Column({ name: 'reasoning', type: 'jsonb' })
  reasoning: string[];

  @Column({ name: 'escalate', type: 'boolean', default: false })
  escalate: boolean;

  @Column({
    name: 'human_outcome',
    type: 'enum',
    enum: RiskAgentHumanOutcomeEnum,
    enumName: 'RiskAgentHumanOutcomeEnum',
    default: RiskAgentHumanOutcomeEnum.PENDING,
  })
  humanOutcome: RiskAgentHumanOutcomeEnum;

  @Column({ name: 'human_actor_id', type: 'integer', nullable: true })
  humanActorId: number | null;

  @Column({ name: 'human_note', type: 'text', nullable: true })
  humanNote: string | null;

  @Column({ name: 'resolved_at', type: 'timestamp without time zone', nullable: true })
  resolvedAt: Date | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
  })
  createdAt: Date;

  constructor(entity: Partial<OrganizationKycRecommendation> = {}) {
    Object.assign(this, entity);
  }
}
