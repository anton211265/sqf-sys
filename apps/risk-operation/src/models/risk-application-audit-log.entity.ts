import { RiskApplicationAuditActionEnum } from '@app/common/apps/risk-operation/enums/risk-application-audit-action.enum';
import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { RiskApplicationScoring } from './risk-application-scoring.entity';

@Entity()
export class RiskApplicationAuditLog extends AbstractEntity<RiskApplicationAuditLog> {
  // ------------------ Relationship ------------------

  @ManyToOne(() => RiskApplicationScoring, (scoring) => scoring.auditLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'risk_application_scoring_id' })
  riskApplicationScoring: RiskApplicationScoring;

  // ------------------ Relationship ------------------

  @Column({ name: 'risk_application_scoring_id', type: 'int' })
  riskApplicationScoringId: number;

  @Column({
    name: 'action_type',
    type: 'enum',
    enum: RiskApplicationAuditActionEnum,
    enumName: 'RiskApplicationAuditActionEnum',
  })
  actionType: RiskApplicationAuditActionEnum;

  @Column({ name: 'performed_by', type: 'varchar' })
  performedBy: string;

  @Column({ type: 'varchar', nullable: true })
  details: string;

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
    onUpdate: 'LOCALTIMESTAMP',
  })
  updatedAt: Date;
}
