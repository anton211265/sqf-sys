import {
  Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';

export enum OfferStatusEnum {
  DRAFT = 'DRAFT',
  PENDING_CHECK = 'PENDING_CHECK',
  CHECKED = 'CHECKED',
  APPROVED = 'APPROVED',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  LAPSED = 'LAPSED',
  CLOSED_ARCHIVED = 'CLOSED_ARCHIVED',
}

/** Provisional offer (CRC pass 2) — maker-checker-approver chain per the
 * blueprint; rate-card provenance snapshotted, CRA overrides recorded. */
@Entity('provisional_offer')
export class ProvisionalOffer {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'funder_organization_id', type: 'integer' }) funderOrganizationId: number;
  @Column({ name: 'application_id', type: 'integer' }) applicationId: number;
  @Column({ name: 'organization_id', type: 'integer' }) organizationId: number;
  @Column({ name: 'company_name', type: 'varchar', nullable: true }) companyName: string | null;
  @Column({ name: 'product_code', type: 'varchar' }) productCode: string;
  @Column({ type: 'varchar' }) scenario: string;
  @Column({ name: 'rate_card_snapshot', type: 'jsonb', nullable: true }) rateCardSnapshot: Record<string, any> | null;
  @Column({ type: 'jsonb', default: {} }) inputs: Record<string, any>;
  @Column({ type: 'jsonb', nullable: true }) overrides: Record<string, any> | null;
  @Column({ type: 'jsonb', nullable: true }) outputs: Record<string, any> | null;
  @Column({ type: 'varchar', default: OfferStatusEnum.DRAFT }) status: OfferStatusEnum;
  @Column({ name: 'maker_person_id', type: 'integer' }) makerPersonId: number;
  @Column({ name: 'checker_person_id', type: 'integer', nullable: true }) checkerPersonId: number | null;
  @Column({ name: 'approver_person_id', type: 'integer', nullable: true }) approverPersonId: number | null;
  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true }) submittedAt: Date | null;
  @Column({ name: 'checked_at', type: 'timestamp', nullable: true }) checkedAt: Date | null;
  @Column({ name: 'approved_at', type: 'timestamp', nullable: true }) approvedAt: Date | null;
  @Column({ name: 'sent_at', type: 'timestamp', nullable: true }) sentAt: Date | null;
  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true }) resolvedAt: Date | null;
  @Column({ name: 'resolution_note', type: 'varchar', length: 300, nullable: true }) resolutionNote: string | null;
  @Column({ name: 'registration_fee_confirmed_at', type: 'timestamp', nullable: true }) registrationFeeConfirmedAt: Date | null;
  @Column({ name: 'registration_fee_confirmed_by', type: 'integer', nullable: true }) registrationFeeConfirmedBy: number | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamp without time zone', default: () => 'LOCALTIMESTAMP' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp without time zone', default: () => 'LOCALTIMESTAMP', onUpdate: 'LOCALTIMESTAMP' }) updatedAt: Date;
}

/** Local mirror of PUBLISHED rate cards (RATE_CARD_PUBLISHED consumer). */
@Entity('rate_card_mirror')
export class RateCardMirror {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'funder_organization_id', type: 'integer' }) funderOrganizationId: number;
  @Column({ name: 'product_code', type: 'varchar' }) productCode: string;
  @Column({ name: 'rate_card_id', type: 'integer', nullable: true }) rateCardId: number | null;
  @Column({ type: 'integer', nullable: true }) version: number | null;
  @Column({ type: 'jsonb' }) params: Record<string, any>;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp without time zone', default: () => 'LOCALTIMESTAMP', onUpdate: 'LOCALTIMESTAMP' }) updatedAt: Date;
}
