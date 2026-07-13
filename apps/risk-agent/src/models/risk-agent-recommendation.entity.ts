import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum RiskAgentFilterStageEnum {
  FILTER_1 = 'FILTER_1',
  FILTER_2 = 'FILTER_2',
}

export enum RiskAgentDecisionEnum {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  ESCALATE = 'ESCALATE',
}

export enum RiskAgentHumanOutcomeEnum {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  OVERRIDDEN = 'OVERRIDDEN',
}

/**
 * Output contract matches agents/domain/risk-agent/AGENT.md:
 * { decision, confidence, reasoning, escalate }. The agent never writes
 * risk-operation's riskFilter1Status / isSubmittedForSettlement directly —
 * a human confirms or overrides via the CRC dashboard, which then calls
 * risk-operation's own endpoints. humanOutcome + humanActorId close the
 * audit loop on this side.
 */
@Entity('risk_agent_recommendation')
export class RiskAgentRecommendation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'application_id', type: 'integer' })
  applicationId: number;

  @Column({ name: 'application_number', type: 'varchar' })
  applicationNumber: string;

  @Column({
    name: 'filter_stage',
    type: 'enum',
    enum: RiskAgentFilterStageEnum,
    enumName: 'RiskAgentFilterStageEnum',
  })
  filterStage: RiskAgentFilterStageEnum;

  @Column({
    name: 'decision',
    type: 'enum',
    enum: RiskAgentDecisionEnum,
    enumName: 'RiskAgentDecisionEnum',
  })
  decision: RiskAgentDecisionEnum;

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

  constructor(entity: Partial<RiskAgentRecommendation> = {}) {
    Object.assign(this, entity);
  }
}
