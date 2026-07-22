import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { Person } from './person.entity';

/**
 * One-time token authorizing a person to register their first passkey.
 * This is the only way into the system for an account with no usable
 * credential (bootstrap SQFSYS, new staff, or recovery after losing all
 * devices) now that password login is gone.
 */
@Entity()
export class EnrollmentToken extends AbstractEntity<EnrollmentToken> {
  @ManyToOne(() => Person, { onDelete: 'CASCADE' })
  person: Person;

  // sha256 hex of the raw token — the raw value only ever lives in the issued URL
  @Column({ unique: true })
  tokenHash: string;

  @Column({ type: 'timestamp without time zone' })
  expiresAt: Date;

  @Column({ type: 'timestamp without time zone', nullable: true })
  usedAt: Date | null;

  // null when issued by a seed/ops script rather than a logged-in admin
  @Column({ type: 'int', nullable: true })
  createdByPersonId: number | null;

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
