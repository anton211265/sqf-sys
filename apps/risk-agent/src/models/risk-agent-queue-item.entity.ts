import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RiskAgentQueueStatusEnum {
  NEW = 'NEW',
  FILTER_SELECTED = 'FILTER_SELECTED',
  AWAITING_DOCUMENTS = 'AWAITING_DOCUMENTS',
  FILTER_1_RECOMMENDED = 'FILTER_1_RECOMMENDED',
  FILTER_1_CONFIRMED = 'FILTER_1_CONFIRMED',
  FILTER_2_RECOMMENDED = 'FILTER_2_RECOMMENDED',
  FILTER_2_CONFIRMED = 'FILTER_2_CONFIRMED',
  CLOSED = 'CLOSED',
}

/**
 * One row per application the Risk Agent is tracking through the
 * recommend-only pipeline (see agents/domain/risk-agent/AGENT.md).
 * This is the agent's own working state — it never substitutes for
 * risk-operation's Application/RiskApplicationScoring records, which
 * remain the system of record.
 */
@Entity('risk_agent_queue_item')
export class RiskAgentQueueItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'application_id', type: 'integer' })
  applicationId: number;

  @Column({ name: 'application_number', type: 'varchar' })
  applicationNumber: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: RiskAgentQueueStatusEnum,
    enumName: 'RiskAgentQueueStatusEnum',
    default: RiskAgentQueueStatusEnum.NEW,
  })
  status: RiskAgentQueueStatusEnum;

  @Column({ name: 'selected_risk_model_number', type: 'varchar', nullable: true })
  selectedRiskModelNumber: string | null;

  @Column({ name: 'selected_risk_profile_code', type: 'varchar', nullable: true })
  selectedRiskProfileCode: string | null;

  @Column({ name: 'filter_selection_reasoning', type: 'text', nullable: true })
  filterSelectionReasoning: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
  })
  updatedAt: Date;

  constructor(entity: Partial<RiskAgentQueueItem> = {}) {
    Object.assign(this, entity);
  }
}
