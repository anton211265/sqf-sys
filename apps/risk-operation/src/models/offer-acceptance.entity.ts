import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Append-only passkey e-signature record (Customer Portal pass 2) — the
 * blueprint's acceptance evidence: exact terms hash, timestamp, IP,
 * credential id. Written only after trade-directory verified a fresh
 * assertion and minted the 5-minute esign JWT this row's claims came from.
 */
@Entity('offer_acceptance')
export class OfferAcceptance {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'offer_id', type: 'integer' }) offerId: number;
  @Column({ name: 'application_id', type: 'integer' }) applicationId: number;
  @Column({ name: 'organization_id', type: 'integer' }) organizationId: number;
  @Column({ name: 'person_id', type: 'integer' }) personId: number;
  @Column({ name: 'credential_id', type: 'varchar' }) credentialId: string;
  @Column({ name: 'terms_sha256', type: 'varchar' }) termsSha256: string;
  @Column({ type: 'varchar' }) decision: 'ACCEPTED' | 'DECLINED';
  @Column({ name: 'decline_reason', type: 'varchar', length: 300, nullable: true }) declineReason: string | null;
  @Column({ name: 'ip_address', type: 'varchar', nullable: true }) ipAddress: string | null;
  @Column({ name: 'user_agent', type: 'varchar', nullable: true }) userAgent: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamp without time zone', default: () => 'LOCALTIMESTAMP' }) createdAt: Date;
}
