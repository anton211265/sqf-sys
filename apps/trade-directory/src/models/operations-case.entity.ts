import {
  Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';

export enum OperationsCaseStatusEnum {
  NEW = 'NEW',
  IN_PREPARATION = 'IN_PREPARATION',
  PENDING_CHECK = 'PENDING_CHECK',
  CHECKED = 'CHECKED',
  PENDING_SIGNATURE = 'PENDING_SIGNATURE',
  EXECUTED = 'EXECUTED',
  CLOSED = 'CLOSED',
}

/**
 * Operations Hub pass 1 (2026-07-24) — the Product Approval stage per
 * blueprint §1: an onboarded (fee-paid) client queues here; the assigned
 * Operator owns the lifecycle, prepares the facility-agreement pack
 * (operator maker -> second operator check -> Operations Manager approve),
 * the client's signatory signs with a passkey, and the facility goes live
 * as a FACILITY_AGREEMENT contract row (knowledge graph projects it).
 */
@Entity('operations_case')
export class OperationsCase {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'integer' }) funderOrganizationId: number;
  @Column({ type: 'integer' }) organizationId: number;
  @Column({ type: 'varchar', nullable: true }) companyName: string | null;
  @Column({ type: 'integer', nullable: true }) applicationId: number | null;
  @Column({ type: 'integer', nullable: true }) offerId: number | null;
  @Column({ type: 'varchar' }) productCode: string;
  @Column({ type: 'varchar', default: OperationsCaseStatusEnum.NEW }) status: OperationsCaseStatusEnum;
  @Column({ type: 'integer', nullable: true }) operatorPersonId: number | null;
  @Column({ type: 'integer', nullable: true }) checkerPersonId: number | null;
  @Column({ type: 'integer', nullable: true }) approverPersonId: number | null;
  /** Rendered agreement pack (deterministic text; configurator Handlebars
   * template-pack integration is a recorded follow-up). */
  @Column({ type: 'text', nullable: true }) agreementText: string | null;
  @Column({ type: 'varchar', nullable: true }) agreementSha256: string | null;
  @Column({ type: 'jsonb', nullable: true }) agreementTerms: Record<string, any> | null;
  @Column({ type: 'integer', nullable: true }) signedByPersonId: number | null;
  @Column({ type: 'varchar', nullable: true }) signedCredentialId: string | null;
  @Column({ type: 'timestamp', nullable: true }) signedAt: Date | null;
  @Column({ type: 'varchar', nullable: true }) signatureIp: string | null;
  @Column({ type: 'integer', nullable: true }) contractId: number | null;
  @Column({ type: 'varchar', length: 300, nullable: true }) resolutionNote: string | null;
  @CreateDateColumn({ type: 'timestamp without time zone', default: () => 'LOCALTIMESTAMP' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp without time zone', default: () => 'LOCALTIMESTAMP', onUpdate: 'LOCALTIMESTAMP' }) updatedAt: Date;
}
