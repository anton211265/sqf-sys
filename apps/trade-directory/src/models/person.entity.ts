import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { BankAccount } from './bank-account.entity';
import { Experian } from './experian.entity';
import { OrganizationPerson } from './organization-person.entity';
import { PersonSupportingDocument } from './person-supporting-document.entity';
import { Token } from './token.entity';
import { OnBoardProcessEnum } from '@app/common/apps/trade-directory/enums/onboard-process.enum';

@Entity()
export class Person extends AbstractEntity<Person> {
  // ------------------------------------- SQF AI -------------------------------------

  // ------------------ Relationship ------------------

  @OneToMany(
    () => OrganizationPerson,
    (organizationPerson) => organizationPerson.person,
    { cascade: ['insert', 'update'] },
  )
  organizationPersons?: OrganizationPerson[];

  @OneToMany(() => Token, (token) => token.person)
  tokens: Token[];

  // ------------------ Relationship ------------------

  @Column({ type: 'varchar', nullable: true })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  residentialAddress?: string;

  @Column({ type: 'varchar', nullable: true })
  identificationNumber?: string;

  @Column({ type: 'varchar', nullable: true })
  mobileNumber?: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

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

  // ------------------------------------- SQF AI -------------------------------------

  // ------------------------------------- LCM -------------------------------------

  @OneToMany(() => BankAccount, (bankAccount) => bankAccount.person, {
    cascade: true,
  })
  bankAccounts?: BankAccount[];

  @OneToMany(
    () => PersonSupportingDocument,
    (personSupportingDocument) => personSupportingDocument.person,
    {
      cascade: true,
    },
  )
  personSupportingDocuments?: PersonSupportingDocument[];

  @OneToMany(() => Experian, (experian) => experian.person, {
    cascade: true,
  })
  experianReports?: Experian[];

  @Column({ type: 'varchar', nullable: true })
  preferredUsername?: string;

  // ------------------------------------- LCM -------------------------------------
}
