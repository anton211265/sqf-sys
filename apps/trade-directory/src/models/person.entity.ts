import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { KycAgencyReport } from './kyc-agency-report.entity';
import { OrganizationPerson } from './organization-person.entity';
import { PersonSupportingDocument } from './person-supporting-document.entity';
import { Token } from './token.entity';
import { WebauthnCredential } from './webauthn-credential.entity';
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

  @OneToMany(() => WebauthnCredential, (credential) => credential.person)
  webauthnCredentials?: WebauthnCredential[];

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

  @OneToMany(() => KycAgencyReport, (kycReport) => kycReport.person, {
    cascade: true,
  })
  kycAgencyReports?: KycAgencyReport[];

  @OneToMany(
    () => PersonSupportingDocument,
    (document) => document.person,
    { cascade: true },
  )
  supportingDocuments?: PersonSupportingDocument[];

  @Column({ type: 'varchar', nullable: true })
  preferredUsername?: string;

  // systemRole marks platform-level accounts (e.g. SQFSYS) that have no org membership
  @Column({ name: 'system_role', type: 'varchar', nullable: true })
  systemRole?: string;

  @Column({ type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'timestamp without time zone', nullable: true })
  lockedUntil: Date | null;

  // ------------------------------------- SQF AI -------------------------------------
}
