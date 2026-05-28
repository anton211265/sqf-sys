import { ApplicationStatusEnum } from '@app/common/apps/risk-operation/enums/application-status.enum';
import { LeadSourceEnum } from '@app/common/apps/risk-operation/enums/lead-source.enum';
import { UpdatableBankAccount } from '@app/common/apps/trade-directory/types/bank-account.type';
import { UpdatableOrganizationPerson } from '@app/common/apps/trade-directory/types/organization-person.type';
import {
  Organization,
  UpdatableOrganization,
} from '@app/common/apps/trade-directory/types/organization.type';
import {
  Person,
  UpdatablePerson,
} from '@app/common/apps/trade-directory/types/person.type';
import { CurrencyCodeEnum } from '@app/common/constants/currencies';
import { AbstractEntity } from '@app/common/database/abstract.entity';
import { NumericTransformer } from '@app/common/utils/numeric-transformer';
import { ApplicationPublic } from 'apps/risk-operation/src/models/application-public.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  OneToOne,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { ApplicationSupportingDocument } from './application-supporting-document.entity';
import { ClientAwarderContract } from './client-awarder-contract.entity';
import { Facility } from './facility.entity';
import { GuarantorDto } from '../sqf/application/dto/update-representative-details.dto';
import { ApplicationPersonaEnum } from '@app/common/apps/risk-operation/enums/application-persona.enum';
import { ApplicationPerson } from './application-person.entity';
import { RiskApplicationScoring } from './risk-application-scoring.entity';

@Entity()
export class Application extends AbstractEntity<Application> {
  // ------------------------------------- SQF AI -------------------------------------

  // ------------------ Microservice ------------------

  @Index()
  @Column({
    type: 'integer',
    nullable: false,
    default: 0,
  })
  organizationId: number;

  // ------------------ Microservice ------------------

  // ------------------ Relationship ------------------

  @OneToMany(
    () => ApplicationPerson,
    (applicationPerson) => applicationPerson.application,
  )
  applicationPersons: ApplicationPerson[];

  @OneToOne(() => RiskApplicationScoring, (scoring) => scoring.application, {
    cascade: true,
    eager: false,
  })
  riskApplicationScoring: RiskApplicationScoring;

  // ------------------ Relationship ------------------

  // ------------------ Columns ------------------

  @Column({ type: 'varchar' })
  clientOrganizationName: string;

  @Column({
    type: 'enum',
    enum: ApplicationStatusEnum,
    enumName: 'ApplicationStatusEnum',
    default: ApplicationStatusEnum.DRAFT,
  })
  applicationStatus: ApplicationStatusEnum;

  @Column({
    type: 'enum',
    enum: ApplicationPersonaEnum,
    enumName: 'ApplicationPersonaEnum',
    nullable: true,
  })
  applicationPersona: ApplicationPersonaEnum;

  @Column({ type: 'varchar', unique: true, nullable: true })
  applicationNumber: string;

  @Column({ type: 'timestamp without time zone', nullable: true })
  applicationDate?: Date;

  @Column({ type: 'jsonb', nullable: true })
  shareholders?: {
    person: UpdatablePerson;
    organizationPerson: UpdatableOrganizationPerson;
    shareholdingPercentage: number;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  guarantors?: GuarantorDto[];

  @Column({ type: 'jsonb', nullable: true })
  directors?: {
    person: UpdatablePerson;
    organizationPerson: UpdatableOrganizationPerson;
    authoriseSignatory?: boolean; // Note: to be fixed, make it as required
  }[];

  @Column({ type: 'jsonb', nullable: true })
  clientPersonInCharge?: {
    person: UpdatablePerson;
    organizationPerson: UpdatableOrganizationPerson;
  }[];

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

  // ------------------ Columns ------------------

  // ------------------------------------- SQF AI -------------------------------------

  // ------------------------------------- LCM -------------------------------------

  @ManyToOne(
    () => ClientAwarderContract,
    (clientAwarderContract) => clientAwarderContract.applications,
    {
      cascade: true,
    },
  )
  clientAwarderContract?: ClientAwarderContract;

  @RelationId((application: Application) => application.clientAwarderContract)
  @Column({ type: 'integer', nullable: true })
  clientAwarderContractId?: number;

  @Column({ type: 'jsonb', nullable: true })
  nextOfKins?: {
    person: UpdatablePerson;
    organizationPerson: UpdatableOrganizationPerson;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  corporateGuarantors?: {
    organization: UpdatableOrganization;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  clientContactPersons?: {
    person: UpdatablePerson;
    organizationPerson: UpdatableOrganizationPerson;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  clientBankAccounts?: {
    bankAccount: UpdatableBankAccount;
    preferred: boolean;
    escrow: boolean;
  }[];

  // microservice
  @Column({
    type: 'integer',
    nullable: true,
  })
  clientPersonaId: number;
  clientOrganization?: Organization;

  @Column({
    type: 'enum',
    enum: LeadSourceEnum,
    enumName: 'LeadSourceEnum',
    nullable: true,
  })
  leadSource?: LeadSourceEnum;

  @Column({ type: 'varchar', nullable: true })
  remark?: string;

  @Column({
    type: 'integer',
    nullable: true,
  })
  numberOfContractSecured?: number;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  valueOfContractSecured?: number;

  @Column({
    type: 'enum',
    enum: CurrencyCodeEnum,
    enumName: 'CurrencyCodeEnum',
    default: CurrencyCodeEnum.MYR,
  })
  valueOfContractSecuredCurrency: CurrencyCodeEnum;

  // amount
  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  applicationFee?: number;

  // percentage
  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  latePaymentCharges?: number;

  // percentage
  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  administrationFee?: number;

  // percentage
  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  processingFee?: number;

  // amount
  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  remittanceCharges?: number;

  // amount
  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  collectionFee?: number;

  // amount
  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  eMandateFee?: number;

  // amount
  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  facilityFee?: number;

  // amount
  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  supportLetterCharges?: number;

  // amount
  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  letterOfUndertakingCharges?: number;

  // amount
  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  bankGuaranteeServiceFee?: number;

  // amount
  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  letterOfCreditServiceFee?: number;

  // amount
  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  customerRetention?: number;

  // amount
  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  financialAdvisory?: number;

  // amount
  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  retainerFee?: number;

  // amount
  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  arrangerFee?: number;

  // amount
  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  stampingFee?: number;

  // amount
  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  sinkingFund?: number;

  // amount
  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  approvalFee?: number;

  // microservice
  @Column({
    type: 'integer',
    nullable: true,
  })
  factorPersonaId: number;
  factorOrganization: Organization;

  // microservice
  @Column({
    type: 'integer',
    nullable: true,
  })
  creatorPersonId: number;
  creatorPerson?: Person;

  // microservice
  @Column({
    type: 'integer',
    nullable: true,
  })
  assigneePersonId: number;
  assigneePerson?: Person;

  @OneToMany(() => Facility, (facility) => facility.application, {
    cascade: true,
  })
  facilities?: Facility[];

  @OneToMany(
    () => ApplicationSupportingDocument,
    (applicationSupportingDocument) =>
      applicationSupportingDocument.application,
    {
      cascade: true,
    },
  )
  applicationSupportingDocuments?: ApplicationSupportingDocument[];

  @OneToMany(
    () => ApplicationPublic,
    (applicationPublic) => applicationPublic.application,
    {
      cascade: ['insert', 'update'],
    },
  )
  applicationPublics?: ApplicationPublic[];

  // ------------------------------------- LCM -------------------------------------
}
