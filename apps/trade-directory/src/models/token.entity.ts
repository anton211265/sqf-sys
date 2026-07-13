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
export class Token extends AbstractEntity<Token> {
  @ManyToOne(() => Person, (person) => person.tokens, { onDelete: 'CASCADE' })
  person: Person;

  @Column()
  refreshTokenHash: string;

  @Column({ type: 'timestamp without time zone' })
  issuedAt: Date;

  @Column({ type: 'timestamp without time zone' })
  lastUsedAt: Date;

  @Column({ type: 'timestamp without time zone' })
  expiresAt: Date;

  @Column({ type: 'timestamp without time zone', nullable: true })
  revokedAt: Date | null;

  @Column({ nullable: true })
  revokedReason: string | null;

  @Column({ nullable: true })
  userAgent: string | null;

  @Column({ nullable: true })
  ipAddress: string | null;

  @Column({ type: 'uuid' })
  tokenFamilyId: string;

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
