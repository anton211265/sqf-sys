/* eslint-disable */
import { wrappers } from 'protobufjs';
import { CountryCodeEnum } from '../../common/proto/countries';
import { CurrencyCodeEnum } from '../../common/proto/currencies';
import { Token } from 'apps/trade-directory/src/models/token.entity';

export const protobufPackage = 'trade_directory';

export enum OrganizationTypeEnum {
  GOVERNMENT_EP = 'ORGANIZATION_TYPE_ENUM_GOVERNMENT_EP',
  GOVERNMENT_NON_EP = 'ORGANIZATION_TYPE_ENUM_GOVERNMENT_NON_EP',
  GOVERNMENT_LINKED_COMPANY = 'ORGANIZATION_TYPE_ENUM_GOVERNMENT_LINKED_COMPANY',
  MULTINATIONAL_CORPORATION = 'ORGANIZATION_TYPE_ENUM_MULTINATIONAL_CORPORATION',
  PUBLIC_LIMITED = 'ORGANIZATION_TYPE_ENUM_PUBLIC_LIMITED',
  PRIVATE_LIMITED = 'ORGANIZATION_TYPE_ENUM_PRIVATE_LIMITED',
  PARTNERSHIP = 'ORGANIZATION_TYPE_ENUM_PARTNERSHIP',
  SOLE_PROPRIETORSHIP = 'ORGANIZATION_TYPE_ENUM_SOLE_PROPRIETORSHIP',
  COOPERATIVE = 'ORGANIZATION_TYPE_ENUM_COOPERATIVE',
  OTHERS = 'ORGANIZATION_TYPE_ENUM_OTHERS',
  UNRECOGNIZED = 'UNRECOGNIZED',
}

export enum OrganizationBusinessSectorEnum {
  SUPPLY = 'ORGANIZATION_BUSINESS_SECTOR_ENUM_SUPPLY',
  SERVICES = 'ORGANIZATION_BUSINESS_SECTOR_ENUM_SERVICES',
  SUPPLY_AND_SERVICES = 'ORGANIZATION_BUSINESS_SECTOR_ENUM_SUPPLY_AND_SERVICES',
  RETAIL = 'ORGANIZATION_BUSINESS_SECTOR_ENUM_RETAIL',
  WHOLESALE = 'ORGANIZATION_BUSINESS_SECTOR_ENUM_WHOLESALE',
  MANUFACTURING = 'ORGANIZATION_BUSINESS_SECTOR_ENUM_MANUFACTURING',
  CONSTRUCTION = 'ORGANIZATION_BUSINESS_SECTOR_ENUM_CONSTRUCTION',
  INFORMATION_AND_COMMUNICATION = 'ORGANIZATION_BUSINESS_SECTOR_ENUM_INFORMATION_AND_COMMUNICATION',
  OTHERS = 'ORGANIZATION_BUSINESS_SECTOR_ENUM_OTHERS',
  UNRECOGNIZED = 'UNRECOGNIZED',
}

export enum OrganizationNatureOfBusinessEnum {
  AGRICULTURE = 'ORGANIZATION_NATURE_OF_BUSINESS_ENUM_AGRICULTURE',
  AUTOMOBILE = 'ORGANIZATION_NATURE_OF_BUSINESS_ENUM_AUTOMOBILE',
  AVIATION = 'ORGANIZATION_NATURE_OF_BUSINESS_ENUM_AVIATION',
  BUSINESS_SERVICES = 'ORGANIZATION_NATURE_OF_BUSINESS_ENUM_BUSINESS_SERVICES',
  COMMUNICATION_AND_DIGITAL = 'ORGANIZATION_NATURE_OF_BUSINESS_ENUM_COMMUNICATION_AND_DIGITAL',
  CONSTRUCTION = 'ORGANIZATION_NATURE_OF_BUSINESS_ENUM_CONSTRUCTION',
  DEFENCE = 'ORGANIZATION_NATURE_OF_BUSINESS_ENUM_DEFENCE',
  EDUCATION = 'ORGANIZATION_NATURE_OF_BUSINESS_ENUM_EDUCATION',
  ENERGY = 'ORGANIZATION_NATURE_OF_BUSINESS_ENUM_ENERGY',
  ENTREPRENEUR_AND_COOPERATIVE_DEVELOPMENT = 'ORGANIZATION_NATURE_OF_BUSINESS_ENUM_ENTREPRENEUR_AND_COOPERATIVE_DEVELOPMENT',
  ENVIRONMENT_AND_SUSTAINABILITY = 'ORGANIZATION_NATURE_OF_BUSINESS_ENUM_ENVIRONMENT_AND_SUSTAINABILITY',
  FINANCE = 'ORGANIZATION_NATURE_OF_BUSINESS_ENUM_FINANCE',
  HEALTHCARE = 'ORGANIZATION_NATURE_OF_BUSINESS_ENUM_HEALTHCARE',
  HOME_AFFAIRS = 'ORGANIZATION_NATURE_OF_BUSINESS_ENUM_HOME_AFFAIRS',
  HOSPITALITY_AND_TOURISM = 'ORGANIZATION_NATURE_OF_BUSINESS_ENUM_HOSPITALITY_AND_TOURISM',
  UNRECOGNIZED = 'UNRECOGNIZED',
}

export enum OrganizationMalaysiaRegionEnum {
  EAST_MALAYSIA = 'ORGANIZATION_MALAYSIA_REGION_ENUM_EAST_MALAYSIA',
  WEST_MALAYSIA = 'ORGANIZATION_MALAYSIA_REGION_ENUM_WEST_MALAYSIA',
  OTHER = 'ORGANIZATION_MALAYSIA_REGION_ENUM_OTHER',
  UNRECOGNIZED = 'UNRECOGNIZED',
}

export enum OrganizationPersonRoleEnum {
  SUPERUSER = 'SUPERUSER',
  CEO = 'CEO',
  COO = 'COO',
  CLIENT_COVERAGE = 'CLIENT_COVERAGE',
  CUSTOMER_SUCCESS = 'CUSTOMER_SUCCESS',
  CORPORATE_COMMUNICATIONS = 'CORPORATE_COMMUNICATIONS',
  SQFSYS = 'SQFSYS',
  CRM = 'CRM',
  RISK_ANALYST = 'RISK_ANALYST',
  FINANCE = 'FINANCE',
  SUPERVISOR_APPROVAL = 'SUPERVISOR_APPROVAL',
  MANAGER_APPROVAL = 'MANAGER_APPROVAL',
  UNRECOGNIZED = 'UNRECOGNIZED',
}

export enum BankProviderEnum {
  MAYBANK = 'MAYBANK',
  CIMB = 'CIMB',
  PUBLIC_BANK = 'PUBLIC_BANK',
  RHB = 'RHB',
  HONG_LEONG_BANK = 'HONG_LEONG_BANK',
  AMBANK = 'AMBANK',
  UOB = 'UOB',
  BANK_RAKYAT = 'BANK_RAKYAT',
  OCBC = 'OCBC',
  HSBC = 'HSBC',
  BANK_ISLAM = 'BANK_ISLAM',
  AFFIN_BANK = 'AFFIN_BANK',
  ALLIANCE_BANK = 'ALLIANCE_BANK',
  STANDARD_CHARTERED = 'STANDARD_CHARTERED',
  CITIBANK = 'CITIBANK',
  UNRECOGNIZED = 'UNRECOGNIZED',
}

export enum BankAccountTypeEnum {
  CURRENT_ACCOUNT = 'CURRENT_ACCOUNT',
  SAVINGS_ACCOUNT = 'SAVINGS_ACCOUNT',
  MULTI_CURRENCY_ACCOUNT = 'MULTI_CURRENCY_ACCOUNT',
  FIXED_DEPOSIT_ACCOUNT = 'FIXED_DEPOSIT_ACCOUNT',
  UNRECOGNIZED = 'UNRECOGNIZED',
}

export interface Organization {
  id: number;
  organizationName: string;
  alias?: string | undefined;
  country: CountryCodeEnum;
  organizationType?: OrganizationTypeEnum | undefined;
  organizationTypeOther?: string | undefined;
  businessRegistrationNumber?: string | undefined;
  taxIdentificationNumber?: string | undefined;
  sstRegistrationNumber?: string | undefined;
  businessSector?: OrganizationBusinessSectorEnum | undefined;
  kycBusinessSector?: string | undefined;
  natureOfBusiness?: OrganizationNatureOfBusinessEnum | undefined;
  kycNatureOfBusiness?: string | undefined;
  coreBusiness?: string | undefined;
  incorporationDate?: Date | undefined;
  operationStartDate?: Date | undefined;
  businessAddress?: string | undefined;
  registeredAddress?: string | undefined;
  malaysiaRegion?: OrganizationMalaysiaRegionEnum | undefined;
  factoryAddress?: string | undefined;
  organizationWebsite?: string | undefined;
  organizationLogo?: string | undefined;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
  organizationPersons: OrganizationPerson[];
  bankAccounts: BankAccount[];
  clientPersona?: ClientPersona | undefined;
  clientPersonaId?: number | undefined;
  buyerPersona?: BuyerPersona | undefined;
  buyerPersonaId?: number | undefined;
  supplierPersona?: SupplierPersona | undefined;
  supplierPersonaId?: number | undefined;
  funderPersona?: FunderPersona | undefined;
  funderPersonaId?: number | undefined;
  yearEstablished?: string | undefined;
  revenueCurrency?: CurrencyCodeEnum | undefined;
  revenueAmount?: number | undefined;
  emailAddress?: string | undefined;
  contactNumber?: string | undefined;
  postcode?: string | undefined;
  companySize?: string | undefined;
}

export interface UpdatableOrganization {
  organizationName: string;
  alias?: string | undefined;
  countryCode?: CountryCodeEnum | undefined;
  organizationType?: OrganizationTypeEnum | undefined;
  organizationTypeOther?: string | undefined;
  businessRegistrationNumber?: string | undefined;
  taxIdentificationNumber?: string | undefined;
  sstRegistrationNumber?: string | undefined;
  businessSector?: OrganizationBusinessSectorEnum | undefined;
  kycBusinessSector?: string | undefined;
  natureOfBusiness?: OrganizationNatureOfBusinessEnum | undefined;
  kycNatureOfBusiness?: string | undefined;
  coreBusiness?: string | undefined;
  incorporationDate?: Date | undefined;
  operationStartDate?: Date | undefined;
  businessAddress?: string | undefined;
  registeredAddress?: string | undefined;
  malaysiaRegion?: OrganizationMalaysiaRegionEnum | undefined;
  factoryAddress?: string | undefined;
  organizationWebsite?: string | undefined;
  organizationLogo?: string | undefined;
  clientPersonaId?: number | undefined;
  buyerPersonaId?: number | undefined;
  supplierPersonaId?: number | undefined;
  funderPersonaId?: number | undefined;
  yearEstablished?: string | undefined;
}

export interface OrganizationPerson {
  id: number;
  organization?: Organization | undefined;
  organizationId: number;
  person?: Person | undefined;
  personId: number;
  designation?: string | undefined;
  sub?: string | undefined;
  organizationPersonRoles: OrganizationPersonRole[];
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
}

export interface UpdatableOrganizationPerson {
  designation?: string | undefined;
  sub?: string | undefined;
}

export interface Person {
  id: number;
  name: string;
  preferredUsername?: string | undefined;
  residentialAddress?: string | undefined;
  identificationNumber?: string | undefined;
  mobileNumber?: string | undefined;
  email?: string | undefined;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
  organizationPersons: OrganizationPerson[];
  password?: string | undefined;
  tokens: Token[] | undefined;
  systemRole?: string | undefined;
}

export interface UpdatablePerson {
  name?: string | undefined;
  preferredUsername?: string | undefined;
  residentialAddress?: string | undefined;
  identificationNumber?: string | undefined;
  mobileNumber?: string | undefined;
  email?: string | undefined;
}

export interface OrganizationPersonRole {
  id: number;
  role: OrganizationPersonRoleEnum;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
}

export interface ClientPersona {
  id: number;
  clientPersonaId?: string | undefined;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
  organization?: Organization | undefined;
}

export interface UpdatableClientPersona {
  clientPersonaId?: string | undefined;
}

export interface BuyerPersona {
  id: number;
  buyerPersonaId?: string | undefined;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
  organization?: Organization | undefined;
}

export interface UpdatableBuyerPersona {
  buyerPersonaId?: string | undefined;
}

export interface SupplierPersona {
  id: number;
  supplierPersonaId?: string | undefined;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
  organization?: Organization | undefined;
}

export interface UpdatableSupplierPersona {
  supplierPersonaId?: string | undefined;
}

export interface FunderPersona {
  id: number;
  funderPersonaId?: string | undefined;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
  organization?: Organization | undefined;
}

export interface UpdatableFunderPersona {
  funderPersonaId?: string | undefined;
}

export interface BankAccount {
  id: number;
  bankProvider: BankProviderEnum;
  accountHolderName: string;
  branchName?: string | undefined;
  bankAddress?: string | undefined;
  bankAccountNumber: string;
  swiftCode?: string | undefined;
  branchCode?: string | undefined;
  bankAccountType: BankAccountTypeEnum;
  currency: CurrencyCodeEnum;
  onlineBankAvailable: boolean;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
  organization?: Organization | undefined;
  organizationId?: number | undefined;
  person?: Person | undefined;
  personId?: number | undefined;
}

export interface UpdatableBankAccount {
  bankProvider?: BankProviderEnum | undefined;
  accountHolderName?: string | undefined;
  branchName?: string | undefined;
  bankAddress?: string | undefined;
  bankAccountNumber?: string | undefined;
  swiftCode?: string | undefined;
  branchCode?: string | undefined;
  bankAccountType?: BankAccountTypeEnum | undefined;
  currency?: CurrencyCodeEnum | undefined;
  onlineBankAvailable?: boolean | undefined;
  organizationId?: number | undefined;
  personId?: number | undefined;
}

export interface IncludeClientPersona {
  value: boolean;
}

export interface IncludeBuyerPersona {
  value: boolean;
}

export interface IncludeSupplierPersona {
  value: boolean;
}

export interface IncludeFunderPersona {
  value: boolean;
}

export interface IncludeBankAccount {
  value: boolean;
}

export interface IncludePerson {
  value: boolean;
}

export interface IncludeOrganizationPersonRole {
  value: boolean;
}

export interface IncludeOrganizationPerson {
  value: boolean;
  includeOrganization?: IncludeOrganization | undefined;
  includePerson?: IncludePerson | undefined;
  includeOrganizationPersonRole?: IncludeOrganizationPersonRole | undefined;
}

export interface IncludeOrganization {
  value: boolean;
  includeOrganizationPerson?: IncludeOrganizationPerson | undefined;
  includeBankAccount?: IncludeBankAccount | undefined;
  includeClientPersona?: IncludeClientPersona | undefined;
  includeBuyerPersona?: IncludeBuyerPersona | undefined;
  includeSupplierPersona?: IncludeSupplierPersona | undefined;
  includeFunderPersona?: IncludeFunderPersona | undefined;
}

export const TRADE_DIRECTORY_PACKAGE_NAME = 'trade_directory';

wrappers['.google.protobuf.Timestamp'] = {
  fromObject(value: Date) {
    return {
      seconds: value.getTime() / 1000,
      nanos: (value.getTime() % 1000) * 1e6,
    };
  },
  toObject(message: { seconds: number; nanos: number }) {
    return new Date(message.seconds * 1000 + message.nanos / 1e6);
  },
} as any;
