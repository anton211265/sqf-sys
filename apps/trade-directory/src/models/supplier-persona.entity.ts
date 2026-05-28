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
export class SupplierPersona extends AbstractEntity<SupplierPersona> {
  @Column({ type: 'varchar', nullable: true })
  supplierPersonaId?: string;

  @OneToOne(
    () => Organization,
    (organization) => organization.supplierPersona,
    { cascade: ['insert', 'update'] },
  )
  organization?: Organization;

  @OneToMany(
    () => Transaction,
    (transaction) => transaction.firstPartyAsSupplierPersona,
    {
      cascade: true,
    },
  )
  transactionsAsFirstParty?: Transaction[];

  @OneToMany(
    () => Transaction,
    (transaction) => transaction.secondPartyAsSupplierPersona,
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
