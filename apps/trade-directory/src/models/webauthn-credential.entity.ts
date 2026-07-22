import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { Person } from './person.entity';

@Entity()
export class WebauthnCredential extends AbstractEntity<WebauthnCredential> {
  @ManyToOne(() => Person, (person) => person.webauthnCredentials, {
    onDelete: 'CASCADE',
  })
  person: Person;

  // base64url credential ID as produced by the authenticator
  @Column({ unique: true })
  credentialId: string;

  // base64url-encoded COSE public key
  @Column({ type: 'text' })
  publicKey: string;

  // WebAuthn signature counter — bigint because the spec allows the full uint32 range
  @Column({ type: 'bigint', default: 0 })
  counter: string;

  // comma-joined AuthenticatorTransport values (e.g. "internal,hybrid")
  @Column({ nullable: true })
  transports: string | null;

  // 'singleDevice' | 'multiDevice' per SimpleWebAuthn's credentialDeviceType
  @Column({ nullable: true })
  deviceType: string | null;

  @Column({ default: false })
  backedUp: boolean;

  // user-facing name, e.g. "MacBook Touch ID"
  @Column({ nullable: true })
  label: string | null;

  @Column({ type: 'timestamp without time zone', nullable: true })
  lastUsedAt: Date | null;

  // soft revoke — revoked credentials are kept for the audit trail
  @Column({ type: 'timestamp without time zone', nullable: true })
  revokedAt: Date | null;

  @CreateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
    onUpdate: 'LOCALTIMESTAMP',
  })
  updatedAt: Date;
}
