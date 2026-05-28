import { AbstractEntity } from '@app/common/database/abstract.entity';
import { NumericTransformer } from '@app/common/utils/numeric-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { ClientPersona } from './client-persona.entity';
import { ContractAwarderPersona } from './contract-awarder-persona.entity';
import { SupplierPersona } from './supplier-persona.entity';

@Entity()
export class Transaction extends AbstractEntity<Transaction> {
  @Column({ type: 'timestamp without time zone', nullable: true })
  date?: Date;

  @Column({ type: 'varchar', nullable: true })
  ref?: string;

  @Column({ type: 'varchar', nullable: true })
  description1?: string;

  @Column({ type: 'varchar', nullable: true })
  description2?: string;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  debit?: number;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  credit?: number;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  balance?: number;

  @Column({ type: 'varchar', nullable: true })
  parameter?: string;

  @Column({ type: 'varchar', nullable: true })
  facility?: string;

  @Column({ type: 'varchar', nullable: true })
  details?: string;

  @ManyToOne(
    () => ClientPersona,
    (clientPersona) => clientPersona.transactionsAsFirstParty,
    {
      cascade: ['insert', 'update'],
    },
  )
  firstPartyAsClientPersona?: ClientPersona;

  @RelationId(
    (transaction: Transaction) => transaction.firstPartyAsClientPersona,
  )
  @Column({ nullable: true })
  firstPartyAsClientPersonaId: number;

  @ManyToOne(
    () => ClientPersona,
    (clientPersona) => clientPersona.transactionsAsSecondParty,
    {
      cascade: ['insert', 'update'],
    },
  )
  secondPartyAsClientPersona?: ClientPersona;

  @RelationId(
    (transaction: Transaction) => transaction.secondPartyAsClientPersona,
  )
  @Column({ nullable: true })
  secondPartyAsClientPersonaId: number;

  @ManyToOne(
    () => ContractAwarderPersona,
    (contractAwarderPersona) => contractAwarderPersona.transactionsAsFirstParty,
    {
      cascade: ['insert', 'update'],
    },
  )
  firstPartyAsContractAwarderPersona?: ContractAwarderPersona;

  @RelationId(
    (transaction: Transaction) =>
      transaction.firstPartyAsContractAwarderPersona,
  )
  @Column({ nullable: true })
  firstPartyAsContractAwarderPersonaId: number;

  @ManyToOne(
    () => ContractAwarderPersona,
    (contractAwarderPersona) =>
      contractAwarderPersona.transactionsAsSecondParty,
    {
      cascade: ['insert', 'update'],
    },
  )
  secondPartyAsContractAwarderPersona?: ContractAwarderPersona;

  @RelationId(
    (transaction: Transaction) =>
      transaction.secondPartyAsContractAwarderPersona,
  )
  @Column({ nullable: true })
  secondPartyAsContractAwarderPersonaId: number;

  @ManyToOne(
    () => SupplierPersona,
    (supplierPersona) => supplierPersona.transactionsAsFirstParty,
    {
      cascade: ['insert', 'update'],
    },
  )
  firstPartyAsSupplierPersona?: SupplierPersona;

  @RelationId(
    (transaction: Transaction) => transaction.firstPartyAsSupplierPersona,
  )
  @Column({ nullable: true })
  firstPartyAsSupplierPersonaId: number;

  @ManyToOne(
    () => SupplierPersona,
    (supplierPersona) => supplierPersona.transactionsAsSecondParty,
    {
      cascade: ['insert', 'update'],
    },
  )
  secondPartyAsSupplierPersona?: SupplierPersona;

  @RelationId(
    (transaction: Transaction) => transaction.secondPartyAsSupplierPersona,
  )
  @Column({ nullable: true })
  secondPartyAsSupplierPersonaId: number;

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
