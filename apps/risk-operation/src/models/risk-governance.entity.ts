import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ChangeRequestStatusEnum {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface ProposedWeightChange {
  weightId: number;
  parameterName: string;
  oldWeight: number;
  newWeight: number;
}

/**
 * Maker-checker change request for risk profile weights (SQFSYS ruling:
 * default-profile changes need Risk Operations Manager approval + a risk
 * audit trail). The maker holds risk_profiles_edit, the checker
 * risk_profiles_approve, and the same person can never be both for one
 * request (enforced in RiskGovernanceService.approve).
 */
@Entity('risk_profile_change_request')
export class RiskProfileChangeRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'risk_profile_id', type: 'integer' })
  riskProfileId: number;

  @Column({ name: 'risk_profile_code', type: 'varchar' })
  riskProfileCode: string;

  @Column({ name: 'proposed_weights', type: 'jsonb' })
  proposedWeights: ProposedWeightChange[];

  @Column({ type: 'varchar', default: ChangeRequestStatusEnum.PENDING })
  status: ChangeRequestStatusEnum;

  @Column({ name: 'requested_by_person_id', type: 'integer' })
  requestedByPersonId: number;

  @Column({ name: 'requested_by_org_id', type: 'integer' })
  requestedByOrgId: number;

  @Column({ name: 'request_reason', type: 'varchar', length: 300, nullable: true })
  requestReason: string | null;

  @Column({ name: 'decided_by_person_id', type: 'integer', nullable: true })
  decidedByPersonId: number | null;

  @Column({ name: 'decided_at', type: 'timestamp', nullable: true })
  decidedAt: Date | null;

  @Column({ name: 'decision_note', type: 'varchar', length: 300, nullable: true })
  decisionNote: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
  })
  createdAt: Date;
}

export enum RiskAuditEvent {
  CHANGE_REQUESTED = 'CHANGE_REQUESTED',
  CHANGE_APPROVED = 'CHANGE_APPROVED',
  CHANGE_REJECTED = 'CHANGE_REJECTED',
}

/** Append-only risk audit trail (no UPDATE/DELETE paths in code). */
@Entity('risk_audit_log')
export class RiskAuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  event: RiskAuditEvent;

  @Column({ name: 'risk_profile_code', type: 'varchar', nullable: true })
  riskProfileCode: string | null;

  @Column({ name: 'actor_person_id', type: 'integer' })
  actorPersonId: number;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, unknown> | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
  })
  createdAt: Date;
}
