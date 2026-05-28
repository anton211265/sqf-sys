import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Transaction } from './transaction.entity';

@Entity()
export class ClientPersona extends AbstractEntity<ClientPersona> {
  @Column({ type: 'varchar', nullable: true })
  clientPersonaId?: string;

  @OneToOne(() => Organization, (organization) => organization.clientPersona, {
    cascade: ['insert', 'update'],
  })
  organization?: Organization;

  @OneToMany(
    () => Transaction,
    (transaction) => transaction.firstPartyAsClientPersona,
    {
      cascade: true,
    },
  )
  transactionsAsFirstParty?: Transaction[];

  @OneToMany(
    () => Transaction,
    (transaction) => transaction.secondPartyAsClientPersona,
    {
      cascade: true,
    },
  )
  transactionsAsSecondParty?: Transaction[];

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
