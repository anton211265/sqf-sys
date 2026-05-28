import { OrganizationBusinessSectorEnum } from '@app/common/apps/trade-directory/enums/organization-business-sector.enum';
import { OrganizationMalaysiaRegionEnum } from '@app/common/apps/trade-directory/enums/organization-malaysia-region.enum';
import { OrganizationNatureOfBusinessEnum } from '@app/common/apps/trade-directory/enums/organization-nature-of-business.enum';
import { OrganizationTypeEnum } from '@app/common/apps/trade-directory/enums/organization-type.enum';
import { CountryCodeEnum } from '@app/common/constants/countries';
import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { BankAccount } from './bank-account.entity';
import { ClientPersona } from './client-persona.entity';
import { ContractAwarderPersona } from './contract-awarder-persona.entity';
import { Experian } from './experian.entity';
import { FactorPersona } from './factor-persona.entity';
import { OrganizationPerson } from './organization-person.entity';
import { SupplierPersona } from './supplier-persona.entity';
import { CurrencyCodeEnum } from '@app/common/constants/currencies';
import { OrganizationCompanySizeEnum } from '@app/common/apps/trade-directory/enums/organization-company-size.enum';
import { BusinessSectorEnum } from '@app/common/apps/trade-directory/enums/business-sector.enum';

@Entity()
export class Organization extends AbstractEntity<Organization> {
  // ------------------------------------- SQF AI -------------------------------------

  // ------------------ Relationship ------------------

  @OneToMany(() => Experian, (experian) => experian.organization, {
    cascade: true,
  })
  experianReports?: Experian[];

  @OneToMany(
    () => OrganizationPerson,
    (organizationPerson) => organizationPerson.organization,
    {
      cascade: true,
    },
  )
  organizationPersons?: OrganizationPerson[];

  // ------------------ Relationship ------------------

  @Column({ type: 'varchar' })
  organizationName: string;

  @Column({ type: 'varchar', nullable: true })
  businessRegistrationNumber?: string;

  @Column({
    type: 'enum',
    enum: CountryCodeEnum,
    enumName: 'CountryCodeEnum',
  })
  country: CountryCodeEnum;

  @Column({
    type: 'enum',
    enum: OrganizationTypeEnum,
    enumName: 'OrganizationTypeEnum',
    nullable: true,
  })
  organizationType?: OrganizationTypeEnum;

  @Column({ type: 'varchar', nullable: true })
  organizationTypeOther?: string;

  @Column({ type: 'varchar', nullable: true })
  taxIdentificationNumber?: string;

  @Column({
    type: 'enum',
    enum: OrganizationBusinessSectorEnum,
    enumName: 'OrganizationBusinessSectorEnum',
    nullable: true,
  })
  businessSector?: OrganizationBusinessSectorEnum;

  @Column({
    type: 'enum',
    enum: BusinessSectorEnum,
    enumName: 'BusinessSectorEnum',
    nullable: true,
  })
  organizationBusinessSector?: BusinessSectorEnum;

  @Column({ type: 'varchar', nullable: true })
  businessSectorOther: string;

  @Column({ type: 'varchar', nullable: true })
  registeredAddress?: string;

  @Column({ type: 'varchar', nullable: true })
  postcode?: string;

  @Column({ type: 'varchar', nullable: true, length: 4 })
  yearEstablished?: string;

  @Column({
    type: 'enum',
    enum: CurrencyCodeEnum,
    enumName: 'CurrencyCodeEnum',
    nullable: true,
  })
  revenueCurrency?: CurrencyCodeEnum;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  revenueAmount?: number;

  @Column({ type: 'varchar', nullable: true })
  emailAddress?: string;

  @Column({ type: 'varchar', nullable: true })
  contactNumber?: string;

  @Column({
    type: 'enum',
    enum: OrganizationCompanySizeEnum,
    enumName: 'OrganizationCompanySizeEnum',
    nullable: true,
  })
  companySize?: OrganizationCompanySizeEnum;

  @Column({ type: 'varchar', nullable: true })
  organizationWebsite?: string;

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

  @Column({ type: 'timestamp', nullable: true })
  fullyOnboardedAt: Date | null;

  // ------------------------------------- SQF AI -------------------------------------

  @Column({ type: 'varchar', nullable: true })
  alias?: string;

  @Column({ type: 'varchar', nullable: true })
  sstRegistrationNumber?: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  experianBusinessSector?: string;

  @Column({
    type: 'enum',
    enum: OrganizationNatureOfBusinessEnum,
    enumName: 'OrganizationNatureOfBusinessEnum',
    nullable: true,
  })
  natureOfBusiness?: OrganizationNatureOfBusinessEnum;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  experianNatureOfBusiness?: string;

  @Column({ type: 'varchar', nullable: true })
  coreBusiness?: string;

  @Column({ type: 'timestamp without time zone', nullable: true })
  incorporationDate?: Date;

  @Column({ type: 'timestamp without time zone', nullable: true })
  operationStartDate?: Date;

  @Column({ type: 'varchar', nullable: true })
  businessAddress?: string;

  @Column({
    type: 'enum',
    enum: OrganizationMalaysiaRegionEnum,
    enumName: 'OrganizationMalaysiaRegionEnum',
    nullable: true,
  })
  malaysiaRegion?: OrganizationMalaysiaRegionEnum;

  @Column({ type: 'varchar', nullable: true })
  factoryAddress?: string;

  @Column({ type: 'varchar', nullable: true })
  organizationLogo?: string;

  @OneToMany(() => BankAccount, (bankAccount) => bankAccount.organization, {
    cascade: true,
  })
  bankAccounts?: BankAccount[];

  // One-to-one relationship with ClientPersona. Organization holds the foreign key (clientPersonaId).
  // Cascade allows automatic saving of related ClientPersona.
  @OneToOne(
    () => ClientPersona, // first argument is the related entity (ClientPersona)
    (clientPersona) => clientPersona.organization, // second argument points to the inverse side of the relationship in the ClientPersona entity (clientPersona.organization)
    { cascade: true },
  )

  // @JoinColumn ensures clientPersonaId is stored in the Organization table.
  // - @JoinColumn: Indicates that Organization is the owner of the relationship, and it will have a foreign key column
  //   (clientPersonaId) that references the primary key (id) of the ClientPersona entity.
  @JoinColumn()
  clientPersona?: ClientPersona;

  // Holds the foreign key value (ID) of the related ClientPersona entity.
  // This field is automatically populated when a ClientPersona is associated with the Organization.
  // Nullable because the Organization may exist without a linked ClientPersona.
  @RelationId((organization: Organization) => organization.clientPersona)
  @Column({ nullable: true })
  clientPersonaId?: number;

  @OneToOne(
    () => ContractAwarderPersona,
    (contractAwarderPersona) => contractAwarderPersona.organization,
    { cascade: true },
  )
  @JoinColumn()
  contractAwarderPersona?: ContractAwarderPersona;

  @RelationId(
    (organization: Organization) => organization.contractAwarderPersona,
  )
  @Column({ nullable: true })
  contractAwarderPersonaId?: number;

  @OneToOne(
    () => SupplierPersona,
    (supplierPersona) => supplierPersona.organization,
    { cascade: true }, // eager: true will automatically load this relationship
  )
  @JoinColumn()
  supplierPersona?: SupplierPersona;

  @RelationId((organization: Organization) => organization.supplierPersona)
  @Column({ nullable: true })
  supplierPersonaId?: number;

  @OneToOne(
    () => FactorPersona,
    (factorPersona) => factorPersona.organization,
    { cascade: true },
  )
  @JoinColumn()
  factorPersona?: FactorPersona;

  @RelationId((organization: Organization) => organization.factorPersona)
  @Column({ nullable: true })
  factorPersonaId?: number;

  toString(): string {
    return JSON.stringify(this);
  }

  // ------------------------------------- LCM -------------------------------------
}
