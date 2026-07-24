import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Immutable record of a Customer Portal pre-registration disclaimer
 * acceptance (blueprint: exact timestamp, IP, account, disclaimer text
 * version). Append-only — no UPDATE/DELETE paths in code. The "version" is
 * the sha256 of the disclaimer body the applicant actually saw (any text
 * edit produces a new hash automatically).
 */
@Entity('disclaimer_acceptance')
export class DisclaimerAcceptance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ name: 'person_id', type: 'integer', nullable: true })
  personId: number | null;

  @Column({ name: 'disclaimer_code', type: 'varchar' })
  disclaimerCode: string;

  @Column({ name: 'disclaimer_hash', type: 'varchar' })
  disclaimerHash: string;

  @Column({ name: 'accepted_terms', type: 'boolean' })
  acceptedTerms: boolean;

  @Column({ name: 'accepted_privacy', type: 'boolean' })
  acceptedPrivacy: boolean;

  /** FLAG_ONLY corporate-email mode: free-mail domain accepted but flagged. */
  @Column({ name: 'corporate_email_flagged', type: 'boolean', default: false })
  corporateEmailFlagged: boolean;

  @Column({ name: 'ip_address', type: 'varchar', nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'varchar', nullable: true })
  userAgent: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
  })
  createdAt: Date;
}
