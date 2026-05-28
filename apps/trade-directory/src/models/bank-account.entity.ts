import { BankAccountTypeEnum } from '@app/common/apps/trade-directory/enums/bank-account-type.enum';
import { BankProviderEnum } from '@app/common/apps/trade-directory/enums/bank-provider.enum';
import { CurrencyCodeEnum } from '@app/common/constants/currencies';
import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Person } from './person.entity';

@Entity()
export class BankAccount extends AbstractEntity<BankAccount> {
  @Column({
    type: 'enum',
    enum: BankProviderEnum,
    enumName: 'BankProviderEnum',
  })
  bankProvider: BankProviderEnum;

  @Column({ type: 'varchar' })
  accountHolderName: string;

  @Column({ type: 'varchar', nullable: true })
  branchName?: string;

  @Column({ type: 'varchar', nullable: true })
  bankAddress?: string;

  @Column({ type: 'varchar' })
  bankAccountNumber: string;

  @Column({ type: 'varchar', nullable: true })
  swiftCode?: string;

  @Column({ type: 'varchar', nullable: true })
  branchCode?: string;

  @Column({
    type: 'enum',
    enum: BankAccountTypeEnum,
    enumName: 'BankAccountTypeEnum',
    nullable: true,
  })
  bankAccountType: BankAccountTypeEnum;

  @Column({
    type: 'enum',
    enum: CurrencyCodeEnum,
    enumName: 'CurrencyCodeEnum',
    default: CurrencyCodeEnum.MYR,
  })
  currency: CurrencyCodeEnum;

  @Column({ type: 'boolean' })
  onlineBankAvailable: boolean;

  @ManyToOne(() => Organization, (organization) => organization.bankAccounts, {
    cascade: ['insert', 'update'],
  })
  organization?: Organization;

  @RelationId((bankAccount: BankAccount) => bankAccount.organization)
  @Column({ nullable: true })
  organizationId?: number;

  @ManyToOne(() => Person, (person) => person.bankAccounts, {
    cascade: ['insert', 'update'],
  })
  person?: Person;

  @RelationId((bankAccount: BankAccount) => bankAccount.person)
  @Column({ nullable: true })
  personId?: number;

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
