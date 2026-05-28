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
  // ------------------ Relationship ------------------

  @ManyToOne(() => Person, (person) => person.tokens, { onDelete: 'CASCADE' })
  person: Person;

  // ------------------ Relationship ------------------
  @Column()
  accessToken: string;

  @Column()
  refreshToken: string;

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
