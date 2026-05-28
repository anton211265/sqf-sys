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
export class ContractAwarderPersona extends AbstractEntity<ContractAwarderPersona> {
  @Column({ type: 'varchar', nullable: true })
  contractAwarderPersonaId?: string;

  @OneToOne(
    () => Organization,
    (organization) => organization.contractAwarderPersona,
    { cascade: ['insert', 'update'] },
  )
  organization?: Organization;

  @OneToMany(
    () => Transaction,
    (transaction) => transaction.firstPartyAsContractAwarderPersona,
    {
      cascade: true,
    },
  )
  transactionsAsFirstParty?: Transaction[];

  @OneToMany(
    () => Transaction,
    (transaction) => transaction.secondPartyAsContractAwarderPersona,
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
