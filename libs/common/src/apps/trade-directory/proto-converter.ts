import {
  BankAccount,
  ClientPersona,
  ContractAwarderPersona,
  FactorPersona,
  Organization,
  OrganizationPerson,
  OrganizationPersonRole,
  Person,
  SupplierPersona,
} from 'apps/trade-directory/src/models';
import {
  CountryCodeEnumProtoConverter,
  CurrencyCodeEnumProtoConverter,
} from '../common/proto-converter';
import { BankAccountTypeEnum } from './enums/bank-account-type.enum';
import { BankProviderEnum } from './enums/bank-provider.enum';
import { OrganizationBusinessSectorEnum } from './enums/organization-business-sector.enum';
import { OrganizationMalaysiaRegionEnum } from './enums/organization-malaysia-region.enum';
import { OrganizationNatureOfBusinessEnum } from './enums/organization-nature-of-business.enum';
import { OrganizationPersonRoleEnum } from './enums/organization-person-role.enum';
import { OrganizationTypeEnum } from './enums/organization-type.enum';
import {
  BankAccount as ProtoBankAccount,
  BankAccountTypeEnum as ProtoBankAccountTypeEnum,
  BankProviderEnum as ProtoBankProviderEnum,
  ClientPersona as ProtoClientPersona,
  ContractAwarderPersona as ProtoContractAwarderPersona,
  FactorPersona as ProtoFactorPersona,
  Organization as ProtoOrganization,
  OrganizationBusinessSectorEnum as ProtoOrganizationBusinessSectorEnum,
  OrganizationMalaysiaRegionEnum as ProtoOrganizationMalaysiaRegionEnum,
  OrganizationNatureOfBusinessEnum as ProtoOrganizationNatureOfBusinessEnum,
  OrganizationPerson as ProtoOrganizationPerson,
  OrganizationPersonRole as ProtoOrganizationPersonRole,
  OrganizationPersonRoleEnum as ProtoOrganizationPersonRoleEnum,
  OrganizationTypeEnum as ProtoOrganizationTypeEnum,
  Person as ProtoPerson,
  SupplierPersona as ProtoSupplierPersona,
  UpdatableBankAccount as ProtoUpdatableBankAccount,
  UpdatableClientPersona as ProtoUpdatableClientPersona,
  UpdatableContractAwarderPersona as ProtoUpdatableContractAwarderPersona,
  UpdatableFactorPersona as ProtoUpdatableFactorPersona,
  UpdatableOrganization as ProtoUpdatableOrganization,
  UpdatableOrganizationPerson as ProtoUpdatableOrganizationPerson,
  UpdatablePerson as ProtoUpdatablePerson,
  UpdatableSupplierPersona as ProtoUpdatableSupplierPersona,
} from './proto/entity';
import { UpdatableBankAccount } from './types/bank-account.type';
import { UpdatableClientPersona } from './types/client-persona.type';
import { UpdatableContractAwarderPersona } from './types/contract-awarder-persona.type';
import { UpdatableFactorPersona } from './types/factor-persona.type';
import { UpdatableOrganizationPerson } from './types/organization-person.type';
import { UpdatableOrganization } from './types/organization.type';
import { UpdatablePerson } from './types/person.type';
import { UpdatableSupplierPersona } from './types/supplier-persona.type';

class OrganizationTypeEnumProtoConverter {
  static convertToApp = (
    value: ProtoOrganizationTypeEnum,
  ): OrganizationTypeEnum | undefined => {
    const map: Record<
      ProtoOrganizationTypeEnum,
      OrganizationTypeEnum | undefined
    > = {
      [ProtoOrganizationTypeEnum.GOVERNMENT_EP]:
        OrganizationTypeEnum.GOVERNMENT_EP,
      [ProtoOrganizationTypeEnum.GOVERNMENT_NON_EP]:
        OrganizationTypeEnum.GOVERNMENT_NON_EP,
      [ProtoOrganizationTypeEnum.GOVERNMENT_LINKED_COMPANY]:
        OrganizationTypeEnum.GOVERNMENT_LINKED_COMPANY,
      [ProtoOrganizationTypeEnum.MULTINATIONAL_CORPORATION]:
        OrganizationTypeEnum.MULTINATIONAL_CORPORATION,
      [ProtoOrganizationTypeEnum.PUBLIC_LIMITED]:
        OrganizationTypeEnum.PUBLIC_LIMITED,
      [ProtoOrganizationTypeEnum.PRIVATE_LIMITED]:
        OrganizationTypeEnum.PRIVATE_LIMITED,
      [ProtoOrganizationTypeEnum.PARTNERSHIP]: OrganizationTypeEnum.PARTNERSHIP,
      [ProtoOrganizationTypeEnum.SOLE_PROPRIETORSHIP]:
        OrganizationTypeEnum.SOLE_PROPRIETORSHIP,
      [ProtoOrganizationTypeEnum.COOPERATIVE]: OrganizationTypeEnum.COOPERATIVE,
      [ProtoOrganizationTypeEnum.OTHERS]: OrganizationTypeEnum.OTHERS,
      [ProtoOrganizationTypeEnum.UNRECOGNIZED]: undefined,
    };

    return map[value];
  };

  static convertToProto = (
    value: OrganizationTypeEnum,
  ): ProtoOrganizationTypeEnum => {
    const map: Record<OrganizationTypeEnum, ProtoOrganizationTypeEnum> = {
      [OrganizationTypeEnum.GOVERNMENT_EP]:
        ProtoOrganizationTypeEnum.GOVERNMENT_EP,
      [OrganizationTypeEnum.GOVERNMENT_NON_EP]:
        ProtoOrganizationTypeEnum.GOVERNMENT_NON_EP,
      [OrganizationTypeEnum.GOVERNMENT_LINKED_COMPANY]:
        ProtoOrganizationTypeEnum.GOVERNMENT_LINKED_COMPANY,
      [OrganizationTypeEnum.MULTINATIONAL_CORPORATION]:
        ProtoOrganizationTypeEnum.MULTINATIONAL_CORPORATION,
      [OrganizationTypeEnum.PUBLIC_LIMITED]:
        ProtoOrganizationTypeEnum.PUBLIC_LIMITED,
      [OrganizationTypeEnum.PRIVATE_LIMITED]:
        ProtoOrganizationTypeEnum.PRIVATE_LIMITED,
      [OrganizationTypeEnum.PARTNERSHIP]: ProtoOrganizationTypeEnum.PARTNERSHIP,
      [OrganizationTypeEnum.SOLE_PROPRIETORSHIP]:
        ProtoOrganizationTypeEnum.SOLE_PROPRIETORSHIP,
      [OrganizationTypeEnum.COOPERATIVE]: ProtoOrganizationTypeEnum.COOPERATIVE,
      [OrganizationTypeEnum.OTHERS]: ProtoOrganizationTypeEnum.OTHERS,
    };

    return map[value];
  };
}

class OrganizationBusinessSectorEnumProtoConverter {
  static convertToApp = (
    value: ProtoOrganizationBusinessSectorEnum,
  ): OrganizationBusinessSectorEnum | undefined => {
    const map: Record<
      ProtoOrganizationBusinessSectorEnum,
      OrganizationBusinessSectorEnum | undefined
    > = {
      [ProtoOrganizationBusinessSectorEnum.SUPPLY]:
        OrganizationBusinessSectorEnum.SUPPLY,
      [ProtoOrganizationBusinessSectorEnum.SERVICES]:
        OrganizationBusinessSectorEnum.SERVICES,
      [ProtoOrganizationBusinessSectorEnum.SUPPLY_AND_SERVICES]:
        OrganizationBusinessSectorEnum.SUPPLY_AND_SERVICES,
      [ProtoOrganizationBusinessSectorEnum.RETAIL]:
        OrganizationBusinessSectorEnum.RETAIL,
      [ProtoOrganizationBusinessSectorEnum.WHOLESALE]:
        OrganizationBusinessSectorEnum.WHOLESALE,
      [ProtoOrganizationBusinessSectorEnum.MANUFACTURING]:
        OrganizationBusinessSectorEnum.MANUFACTURING,
      [ProtoOrganizationBusinessSectorEnum.CONSTRUCTION]:
        OrganizationBusinessSectorEnum.CONSTRUCTION,
      [ProtoOrganizationBusinessSectorEnum.INFORMATION_AND_COMMUNICATION]:
        OrganizationBusinessSectorEnum.INFORMATION_AND_COMMUNICATION,
      [ProtoOrganizationBusinessSectorEnum.OTHERS]:
        OrganizationBusinessSectorEnum.OTHERS,
      [ProtoOrganizationBusinessSectorEnum.UNRECOGNIZED]: undefined,
    };

    return map[value];
  };

  static convertToProto = (
    value: OrganizationBusinessSectorEnum,
  ): ProtoOrganizationBusinessSectorEnum => {
    const map: Record<
      OrganizationBusinessSectorEnum,
      ProtoOrganizationBusinessSectorEnum
    > = {
      [OrganizationBusinessSectorEnum.SUPPLY]:
        ProtoOrganizationBusinessSectorEnum.SUPPLY,
      [OrganizationBusinessSectorEnum.SERVICES]:
        ProtoOrganizationBusinessSectorEnum.SERVICES,
      [OrganizationBusinessSectorEnum.SUPPLY_AND_SERVICES]:
        ProtoOrganizationBusinessSectorEnum.SUPPLY_AND_SERVICES,
      [OrganizationBusinessSectorEnum.RETAIL]:
        ProtoOrganizationBusinessSectorEnum.RETAIL,
      [OrganizationBusinessSectorEnum.WHOLESALE]:
        ProtoOrganizationBusinessSectorEnum.WHOLESALE,
      [OrganizationBusinessSectorEnum.MANUFACTURING]:
        ProtoOrganizationBusinessSectorEnum.MANUFACTURING,
      [OrganizationBusinessSectorEnum.CONSTRUCTION]:
        ProtoOrganizationBusinessSectorEnum.CONSTRUCTION,
      [OrganizationBusinessSectorEnum.INFORMATION_AND_COMMUNICATION]:
        ProtoOrganizationBusinessSectorEnum.INFORMATION_AND_COMMUNICATION,
      [OrganizationBusinessSectorEnum.OTHERS]:
        ProtoOrganizationBusinessSectorEnum.OTHERS,
    };

    return map[value];
  };
}

class OrganizationNatureOfBusinessEnumProtoConverter {
  static convertToApp = (
    value: ProtoOrganizationNatureOfBusinessEnum,
  ): OrganizationNatureOfBusinessEnum | undefined => {
    const map: Record<
      ProtoOrganizationNatureOfBusinessEnum,
      OrganizationNatureOfBusinessEnum | undefined
    > = {
      [ProtoOrganizationNatureOfBusinessEnum.AGRICULTURE]:
        OrganizationNatureOfBusinessEnum.AGRICULTURE,
      [ProtoOrganizationNatureOfBusinessEnum.AUTOMOBILE]:
        OrganizationNatureOfBusinessEnum.AUTOMOBILE,
      [ProtoOrganizationNatureOfBusinessEnum.AVIATION]:
        OrganizationNatureOfBusinessEnum.AVIATION,
      [ProtoOrganizationNatureOfBusinessEnum.BUSINESS_SERVICES]:
        OrganizationNatureOfBusinessEnum.BUSINESS_SERVICES,
      [ProtoOrganizationNatureOfBusinessEnum.COMMUNICATION_AND_DIGITAL]:
        OrganizationNatureOfBusinessEnum.COMMUNICATION_AND_DIGITAL,
      [ProtoOrganizationNatureOfBusinessEnum.CONSTRUCTION]:
        OrganizationNatureOfBusinessEnum.CONSTRUCTION,
      [ProtoOrganizationNatureOfBusinessEnum.DEFENCE]:
        OrganizationNatureOfBusinessEnum.DEFENCE,
      [ProtoOrganizationNatureOfBusinessEnum.EDUCATION]:
        OrganizationNatureOfBusinessEnum.EDUCATION,
      [ProtoOrganizationNatureOfBusinessEnum.ENERGY]:
        OrganizationNatureOfBusinessEnum.ENERGY,
      [ProtoOrganizationNatureOfBusinessEnum.ENTREPRENEUR_AND_COOPERATIVE_DEVELOPMENT]:
        OrganizationNatureOfBusinessEnum.ENTREPRENEUR_AND_COOPERATIVE_DEVELOPMENT,
      [ProtoOrganizationNatureOfBusinessEnum.ENVIRONMENT_AND_SUSTAINABILITY]:
        OrganizationNatureOfBusinessEnum.ENVIRONMENT_AND_SUSTAINABILITY,
      [ProtoOrganizationNatureOfBusinessEnum.FINANCE]:
        OrganizationNatureOfBusinessEnum.FINANCE,
      [ProtoOrganizationNatureOfBusinessEnum.HEALTHCARE]:
        OrganizationNatureOfBusinessEnum.HEALTHCARE,
      [ProtoOrganizationNatureOfBusinessEnum.HOME_AFFAIRS]:
        OrganizationNatureOfBusinessEnum.HOME_AFFAIRS,
      [ProtoOrganizationNatureOfBusinessEnum.HOSPITALITY_AND_TOURISM]:
        OrganizationNatureOfBusinessEnum.HOSPITALITY_AND_TOURISM,
      [ProtoOrganizationNatureOfBusinessEnum.UNRECOGNIZED]: undefined,
    };

    return map[value];
  };

  static convertToProto = (
    value: OrganizationNatureOfBusinessEnum,
  ): ProtoOrganizationNatureOfBusinessEnum => {
    const map: Record<
      OrganizationNatureOfBusinessEnum,
      ProtoOrganizationNatureOfBusinessEnum
    > = {
      [OrganizationNatureOfBusinessEnum.AGRICULTURE]:
        ProtoOrganizationNatureOfBusinessEnum.AGRICULTURE,
      [OrganizationNatureOfBusinessEnum.AUTOMOBILE]:
        ProtoOrganizationNatureOfBusinessEnum.AUTOMOBILE,
      [OrganizationNatureOfBusinessEnum.AVIATION]:
        ProtoOrganizationNatureOfBusinessEnum.AVIATION,
      [OrganizationNatureOfBusinessEnum.BUSINESS_SERVICES]:
        ProtoOrganizationNatureOfBusinessEnum.BUSINESS_SERVICES,
      [OrganizationNatureOfBusinessEnum.COMMUNICATION_AND_DIGITAL]:
        ProtoOrganizationNatureOfBusinessEnum.COMMUNICATION_AND_DIGITAL,
      [OrganizationNatureOfBusinessEnum.CONSTRUCTION]:
        ProtoOrganizationNatureOfBusinessEnum.CONSTRUCTION,
      [OrganizationNatureOfBusinessEnum.DEFENCE]:
        ProtoOrganizationNatureOfBusinessEnum.DEFENCE,
      [OrganizationNatureOfBusinessEnum.EDUCATION]:
        ProtoOrganizationNatureOfBusinessEnum.EDUCATION,
      [OrganizationNatureOfBusinessEnum.ENERGY]:
        ProtoOrganizationNatureOfBusinessEnum.ENERGY,
      [OrganizationNatureOfBusinessEnum.ENTREPRENEUR_AND_COOPERATIVE_DEVELOPMENT]:
        ProtoOrganizationNatureOfBusinessEnum.ENTREPRENEUR_AND_COOPERATIVE_DEVELOPMENT,
      [OrganizationNatureOfBusinessEnum.ENVIRONMENT_AND_SUSTAINABILITY]:
        ProtoOrganizationNatureOfBusinessEnum.ENVIRONMENT_AND_SUSTAINABILITY,
      [OrganizationNatureOfBusinessEnum.FINANCE]:
        ProtoOrganizationNatureOfBusinessEnum.FINANCE,
      [OrganizationNatureOfBusinessEnum.HEALTHCARE]:
        ProtoOrganizationNatureOfBusinessEnum.HEALTHCARE,
      [OrganizationNatureOfBusinessEnum.HOME_AFFAIRS]:
        ProtoOrganizationNatureOfBusinessEnum.HOME_AFFAIRS,
      [OrganizationNatureOfBusinessEnum.HOSPITALITY_AND_TOURISM]:
        ProtoOrganizationNatureOfBusinessEnum.HOSPITALITY_AND_TOURISM,
    };

    return map[value];
  };
}

class OrganizationMalaysiaRegionEnumProtoConverter {
  static convertToApp = (
    value: ProtoOrganizationMalaysiaRegionEnum,
  ): OrganizationMalaysiaRegionEnum | undefined => {
    const map: Record<
      ProtoOrganizationMalaysiaRegionEnum,
      OrganizationMalaysiaRegionEnum | undefined
    > = {
      [ProtoOrganizationMalaysiaRegionEnum.EAST_MALAYSIA]:
        OrganizationMalaysiaRegionEnum.EAST_MALAYSIA,
      [ProtoOrganizationMalaysiaRegionEnum.WEST_MALAYSIA]:
        OrganizationMalaysiaRegionEnum.WEST_MALAYSIA,
      [ProtoOrganizationMalaysiaRegionEnum.OTHER]:
        OrganizationMalaysiaRegionEnum.OTHER,
      [ProtoOrganizationMalaysiaRegionEnum.UNRECOGNIZED]: undefined,
    };

    return map[value];
  };

  static convertToProto = (
    value: OrganizationMalaysiaRegionEnum,
  ): ProtoOrganizationMalaysiaRegionEnum => {
    const map: Record<
      OrganizationMalaysiaRegionEnum,
      ProtoOrganizationMalaysiaRegionEnum
    > = {
      [OrganizationMalaysiaRegionEnum.EAST_MALAYSIA]:
        ProtoOrganizationMalaysiaRegionEnum.EAST_MALAYSIA,
      [OrganizationMalaysiaRegionEnum.WEST_MALAYSIA]:
        ProtoOrganizationMalaysiaRegionEnum.WEST_MALAYSIA,
      [OrganizationMalaysiaRegionEnum.OTHER]:
        ProtoOrganizationMalaysiaRegionEnum.OTHER,
    };

    return map[value];
  };
}

class OrganizationProtoConverter {
  static convertToApp = (value: ProtoOrganization): Required<Organization> => {
    return {
      id: value.id,
      organizationName: value.organizationName,
      alias: value.alias,
      country: CountryCodeEnumProtoConverter.convertToApp(value.country),
      organizationType: OrganizationTypeEnumProtoConverter.convertToApp(
        value.organizationType,
      ),
      organizationTypeOther: value.organizationTypeOther,
      businessRegistrationNumber: value.businessRegistrationNumber,
      taxIdentificationNumber: value.taxIdentificationNumber,
      sstRegistrationNumber: value.sstRegistrationNumber,
      businessSector: OrganizationBusinessSectorEnumProtoConverter.convertToApp(
        value.businessSector,
      ),
      experianBusinessSector: value.experianBusinessSector,
      natureOfBusiness:
        OrganizationNatureOfBusinessEnumProtoConverter.convertToApp(
          value.natureOfBusiness,
        ),
      experianNatureOfBusiness: value.experianNatureOfBusiness,
      coreBusiness: value.coreBusiness,
      incorporationDate: value.incorporationDate,
      operationStartDate: value.operationStartDate,
      businessAddress: value.businessAddress,
      registeredAddress: value.registeredAddress,
      malaysiaRegion: OrganizationMalaysiaRegionEnumProtoConverter.convertToApp(
        value.malaysiaRegion,
      ),
      factoryAddress: value.factoryAddress,
      organizationWebsite: value.organizationWebsite,
      organizationLogo: value.organizationLogo,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
      organizationPersons: value.organizationPersons.map(
        OrganizationPersonProtoConverter.convertToApp,
      ),
      bankAccounts: value.bankAccounts.map(
        BankAccountProtoConverter.convertToApp,
      ),
      clientPersona: value.clientPersona
        ? ClientPersonaProtoConverter.convertToApp(value.clientPersona)
        : undefined,
      clientPersonaId: value.clientPersonaId,
      contractAwarderPersona: value.contractAwarderPersona
        ? ContractAwarderPersonaProtoConverter.convertToApp(
            value.contractAwarderPersona,
          )
        : undefined,
      contractAwarderPersonaId: value.contractAwarderPersonaId,
      supplierPersona: value.supplierPersona
        ? SupplierPersonaProtoConverter.convertToApp(value.supplierPersona)
        : undefined,
      supplierPersonaId: value.supplierPersonaId,
      factorPersona: value.factorPersona
        ? FactorPersonaProtoConverter.convertToApp(value.factorPersona)
        : undefined,
      factorPersonaId: value.factorPersonaId,
      experianReports: undefined,
      yearEstablished: undefined,
      revenueCurrency: CurrencyCodeEnumProtoConverter.convertToApp(
        value.revenueCurrency,
      ),
      revenueAmount: undefined,
      emailAddress: undefined,
      contactNumber: undefined,
      postcode: undefined,
      companySize: undefined,
      organizationBusinessSector: undefined,
      businessSectorOther: undefined,
      fullyOnboardedAt: undefined,
    };
  };

  static convertToProto = (
    value: Organization,
  ): Required<ProtoOrganization> => {
    return {
      id: value.id,
      organizationName: value.organizationName,
      alias: value.alias,
      country: CountryCodeEnumProtoConverter.convertToProto(value.country),
      organizationType: OrganizationTypeEnumProtoConverter.convertToProto(
        value.organizationType,
      ),
      organizationTypeOther: value.organizationTypeOther,
      businessRegistrationNumber: value.businessRegistrationNumber,
      taxIdentificationNumber: value.taxIdentificationNumber,
      sstRegistrationNumber: value.sstRegistrationNumber,
      businessSector:
        OrganizationBusinessSectorEnumProtoConverter.convertToProto(
          value.businessSector,
        ),
      experianBusinessSector: value.experianBusinessSector,
      natureOfBusiness:
        OrganizationNatureOfBusinessEnumProtoConverter.convertToProto(
          value.natureOfBusiness,
        ),
      experianNatureOfBusiness: value.experianNatureOfBusiness,
      coreBusiness: value.coreBusiness,
      incorporationDate: value.incorporationDate,
      operationStartDate: value.operationStartDate,
      businessAddress: value.businessAddress,
      registeredAddress: value.registeredAddress,
      malaysiaRegion:
        OrganizationMalaysiaRegionEnumProtoConverter.convertToProto(
          value.malaysiaRegion,
        ),
      factoryAddress: value.factoryAddress,
      organizationWebsite: value.organizationWebsite,
      organizationLogo: value.organizationLogo,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
      organizationPersons: value.organizationPersons
        ? value.organizationPersons.map(
            OrganizationPersonProtoConverter.convertToProto,
          )
        : [],
      bankAccounts: value.bankAccounts
        ? value.bankAccounts.map(BankAccountProtoConverter.convertToProto)
        : [],
      clientPersona: value.clientPersona
        ? ClientPersonaProtoConverter.convertToProto(value.clientPersona)
        : undefined,
      clientPersonaId: value.clientPersonaId,
      contractAwarderPersona: value.contractAwarderPersona
        ? ContractAwarderPersonaProtoConverter.convertToProto(
            value.contractAwarderPersona,
          )
        : undefined,
      contractAwarderPersonaId: value.contractAwarderPersonaId,
      supplierPersona: value.supplierPersona
        ? SupplierPersonaProtoConverter.convertToProto(value.supplierPersona)
        : undefined,
      supplierPersonaId: value.supplierPersonaId,
      factorPersona: value.factorPersona
        ? FactorPersonaProtoConverter.convertToProto(value.factorPersona)
        : undefined,
      factorPersonaId: value.factorPersonaId,
      yearEstablished: null,
      revenueCurrency: CurrencyCodeEnumProtoConverter.convertToApp(
        value.revenueCurrency,
      ),
      revenueAmount: undefined,
      emailAddress: null,
      contactNumber: null,
      postcode: null,
      companySize: null,
    };
  };

  static convertToUpdatableApp = (
    value: ProtoUpdatableOrganization,
  ): UpdatableOrganization => {
    return {
      organizationName: value.organizationName,
      alias: value.alias,
      country: CountryCodeEnumProtoConverter.convertToApp(value.countryCode),
      organizationType: OrganizationTypeEnumProtoConverter.convertToApp(
        value.organizationType,
      ),
      organizationTypeOther: value.organizationTypeOther,
      businessRegistrationNumber: value.businessRegistrationNumber,
      taxIdentificationNumber: value.taxIdentificationNumber,
      sstRegistrationNumber: value.sstRegistrationNumber,
      businessSector: OrganizationBusinessSectorEnumProtoConverter.convertToApp(
        value.businessSector,
      ),
      natureOfBusiness:
        OrganizationNatureOfBusinessEnumProtoConverter.convertToApp(
          value.natureOfBusiness,
        ),
      coreBusiness: value.coreBusiness,
      incorporationDate: value.incorporationDate,
      operationStartDate: value.operationStartDate,
      businessAddress: value.businessAddress,
      registeredAddress: value.registeredAddress,
      malaysiaRegion: OrganizationMalaysiaRegionEnumProtoConverter.convertToApp(
        value.malaysiaRegion,
      ),
      factoryAddress: value.factoryAddress,
      organizationWebsite: value.organizationWebsite,
      organizationLogo: value.organizationLogo,
    };
  };

  static convertToUpdatableProto = (
    value: UpdatableOrganization,
  ): ProtoUpdatableOrganization => {
    return {
      organizationName: value.organizationName,
      alias: value.alias,
      countryCode: CountryCodeEnumProtoConverter.convertToProto(value.country),
      organizationType: OrganizationTypeEnumProtoConverter.convertToProto(
        value.organizationType,
      ),
      organizationTypeOther: value.organizationTypeOther,
      businessRegistrationNumber: value.businessRegistrationNumber,
      taxIdentificationNumber: value.taxIdentificationNumber,
      sstRegistrationNumber: value.sstRegistrationNumber,
      businessSector:
        OrganizationBusinessSectorEnumProtoConverter.convertToProto(
          value.businessSector,
        ),
      natureOfBusiness:
        OrganizationNatureOfBusinessEnumProtoConverter.convertToProto(
          value.natureOfBusiness,
        ),
      coreBusiness: value.coreBusiness,
      incorporationDate: value.incorporationDate,
      operationStartDate: value.operationStartDate,
      businessAddress: value.businessAddress,
      registeredAddress: value.registeredAddress,
      malaysiaRegion:
        OrganizationMalaysiaRegionEnumProtoConverter.convertToProto(
          value.malaysiaRegion,
        ),
      factoryAddress: value.factoryAddress,
      organizationWebsite: value.organizationWebsite,
      organizationLogo: value.organizationLogo,
    };
  };
}

class OrganizationPersonProtoConverter {
  static convertToApp = (
    value: ProtoOrganizationPerson,
  ): Required<OrganizationPerson> => {
    return {
      id: value.id,
      organization: value.organization
        ? OrganizationProtoConverter.convertToApp(value.organization)
        : undefined,
      organizationId: value.organizationId,
      person: value.person
        ? PersonProtoConverter.convertToApp(value.person)
        : undefined,
      personId: value.personId,
      designation: value.designation,
      sub: value.sub,
      organizationPersonRoles: value.organizationPersonRoles.map(
        OrganizationPersonRoleProtoConverter.convertToApp,
      ),
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
    };
  };

  static convertToProto = (
    value: OrganizationPerson,
  ): Required<ProtoOrganizationPerson> => {
    return {
      id: value.id,
      organization: value.organization
        ? OrganizationProtoConverter.convertToProto(value.organization)
        : undefined,
      organizationId: value.organizationId,
      person: value.person
        ? PersonProtoConverter.convertToProto(value.person)
        : undefined,
      personId: value.personId,
      designation: value.designation,
      sub: value.sub,
      organizationPersonRoles: value.organizationPersonRoles
        ? value.organizationPersonRoles.map(
            OrganizationPersonRoleProtoConverter.convertToProto,
          )
        : [],
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
    };
  };

  static convertToUpdatableApp = (
    value: ProtoUpdatableOrganizationPerson,
  ): UpdatableOrganizationPerson => {
    return {
      designation: value.designation,
      sub: value.sub,
    };
  };

  static convertToUpdatableProto = (
    value: UpdatableOrganizationPerson,
  ): ProtoUpdatableOrganizationPerson => {
    return {
      designation: value.designation,
      sub: value.sub,
    };
  };
}

class OrganizationPersonRoleEnumProtoConverter {
  static convertToApp = (
    value: ProtoOrganizationPersonRoleEnum,
  ): OrganizationPersonRoleEnum | undefined => {
    const map: Record<
      ProtoOrganizationPersonRoleEnum,
      OrganizationPersonRoleEnum | undefined
    > = {
      [ProtoOrganizationPersonRoleEnum.SUPERUSER]:
        OrganizationPersonRoleEnum.SUPERUSER,
      [ProtoOrganizationPersonRoleEnum.CEO]: OrganizationPersonRoleEnum.CEO,
      [ProtoOrganizationPersonRoleEnum.COO]: OrganizationPersonRoleEnum.COO,
      [ProtoOrganizationPersonRoleEnum.CLIENT_COVERAGE]:
        OrganizationPersonRoleEnum.CLIENT_COVERAGE,
      [ProtoOrganizationPersonRoleEnum.CUSTOMER_SUCCESS]:
        OrganizationPersonRoleEnum.CUSTOMER_SUCCESS,
      [ProtoOrganizationPersonRoleEnum.CORPORATE_COMMUNICATIONS]:
        OrganizationPersonRoleEnum.CORPORATE_COMMUNICATIONS,
      [ProtoOrganizationPersonRoleEnum.UNRECOGNIZED]: undefined,
    };

    return map[value];
  };

  static convertToProto = (
    value: OrganizationPersonRoleEnum,
  ): ProtoOrganizationPersonRoleEnum => {
    const map: Record<
      OrganizationPersonRoleEnum,
      ProtoOrganizationPersonRoleEnum
    > = {
      [OrganizationPersonRoleEnum.SUPERUSER]:
        ProtoOrganizationPersonRoleEnum.SUPERUSER,
      [OrganizationPersonRoleEnum.CEO]: ProtoOrganizationPersonRoleEnum.CEO,
      [OrganizationPersonRoleEnum.COO]: ProtoOrganizationPersonRoleEnum.COO,
      [OrganizationPersonRoleEnum.CLIENT_COVERAGE]:
        ProtoOrganizationPersonRoleEnum.CLIENT_COVERAGE,
      [OrganizationPersonRoleEnum.CUSTOMER_SUCCESS]:
        ProtoOrganizationPersonRoleEnum.CUSTOMER_SUCCESS,
      [OrganizationPersonRoleEnum.CORPORATE_COMMUNICATIONS]:
        ProtoOrganizationPersonRoleEnum.CORPORATE_COMMUNICATIONS,
    };

    return map[value];
  };
}

class OrganizationPersonRoleProtoConverter {
  static convertToApp = (
    value: ProtoOrganizationPersonRole,
  ): Required<OrganizationPersonRole> => {
    return {
      id: value.id,
      organizationPerson: undefined,
      organizationPersonId: undefined,
      organizationRole: undefined,
      organizationRoleId: undefined,
      role: OrganizationPersonRoleEnumProtoConverter.convertToApp(value.role),
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
    };
  };

  static convertToProto = (
    value: OrganizationPersonRole,
  ): Required<ProtoOrganizationPersonRole> => {
    return {
      id: value.id,
      role: OrganizationPersonRoleEnumProtoConverter.convertToProto(value.role),
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
    };
  };
}

class PersonProtoConverter {
  static convertToApp = (value: ProtoPerson): Required<Person> => {
    return {
      id: value.id,
      organizationPersons: value.organizationPersons.map(
        OrganizationPersonProtoConverter.convertToApp,
      ),
      name: value.name,
      preferredUsername: value.preferredUsername,
      residentialAddress: value.residentialAddress,
      identificationNumber: value.identificationNumber,
      mobileNumber: value.mobileNumber,
      email: value.email,
      bankAccounts: undefined,
      personSupportingDocuments: undefined,
      experianReports: undefined,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
      password: undefined,
      tokens: undefined,
    };
  };

  static convertToProto = (value: Person): Required<ProtoPerson> => {
    return {
      id: value.id,
      organizationPersons: value.organizationPersons
        ? value.organizationPersons.map(
            OrganizationPersonProtoConverter.convertToProto,
          )
        : [],
      name: value.name,
      preferredUsername: value.preferredUsername,
      residentialAddress: value.residentialAddress,
      identificationNumber: value.identificationNumber,
      mobileNumber: value.mobileNumber,
      email: value.email,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
      password: undefined,
      tokens: undefined,
    };
  };

  static convertToUpdatableApp = (
    value: ProtoUpdatablePerson,
  ): UpdatablePerson => {
    return {
      name: value.name,
      preferredUsername: value.preferredUsername,
      residentialAddress: value.residentialAddress,
      identificationNumber: value.identificationNumber,
      mobileNumber: value.mobileNumber,
      email: value.email,
    };
  };

  static convertToUpdatableProto = (
    value: UpdatablePerson,
  ): ProtoUpdatablePerson => {
    return {
      name: value.name,
      preferredUsername: value.preferredUsername,
      residentialAddress: value.residentialAddress,
      identificationNumber: value.identificationNumber,
      mobileNumber: value.mobileNumber,
      email: value.email,
    };
  };
}

class ClientPersonaProtoConverter {
  static convertToApp = (
    value: ProtoClientPersona,
  ): Required<ClientPersona> => {
    return {
      id: value.id,
      clientPersonaId: value.clientPersonaId,
      organization: value.organization
        ? OrganizationProtoConverter.convertToApp(value.organization)
        : undefined,
      transactionsAsFirstParty: undefined,
      transactionsAsSecondParty: undefined,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
    };
  };

  static convertToProto = (
    value: ClientPersona,
  ): Required<ProtoClientPersona> => {
    return {
      id: value.id,
      clientPersonaId: value.clientPersonaId,
      organization: value.organization
        ? OrganizationProtoConverter.convertToProto(value.organization)
        : undefined,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
    };
  };

  static convertToUpdatableApp = (
    value: ProtoUpdatableClientPersona,
  ): UpdatableClientPersona => {
    return {
      clientPersonaId: value.clientPersonaId,
    };
  };

  static convertToUpdatableProto = (
    value: UpdatableClientPersona,
  ): ProtoUpdatableClientPersona => {
    return {
      clientPersonaId: value.clientPersonaId,
    };
  };
}

class ContractAwarderPersonaProtoConverter {
  static convertToApp = (
    value: ProtoContractAwarderPersona,
  ): Required<ContractAwarderPersona> => {
    return {
      id: value.id,
      contractAwarderPersonaId: value.contractAwarderPersonaId,
      organization: value.organization
        ? OrganizationProtoConverter.convertToApp(value.organization)
        : undefined,
      transactionsAsFirstParty: undefined,
      transactionsAsSecondParty: undefined,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
    };
  };

  static convertToProto = (
    value: ContractAwarderPersona,
  ): Required<ProtoContractAwarderPersona> => {
    return {
      id: value.id,
      contractAwarderPersonaId: value.contractAwarderPersonaId,
      organization: value.organization
        ? OrganizationProtoConverter.convertToProto(value.organization)
        : undefined,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
    };
  };

  static convertToUpdatableApp = (
    value: ProtoUpdatableContractAwarderPersona,
  ): UpdatableContractAwarderPersona => {
    return {
      contractAwarderPersonaId: value.contractAwarderPersonaId,
    };
  };

  static convertToUpdatableProto = (
    value: UpdatableContractAwarderPersona,
  ): ProtoUpdatableContractAwarderPersona => {
    return {
      contractAwarderPersonaId: value.contractAwarderPersonaId,
    };
  };
}

class SupplierPersonaProtoConverter {
  static convertToApp = (
    value: ProtoSupplierPersona,
  ): Required<SupplierPersona> => {
    return {
      id: value.id,
      supplierPersonaId: value.supplierPersonaId,
      organization: value.organization
        ? OrganizationProtoConverter.convertToApp(value.organization)
        : undefined,
      transactionsAsFirstParty: undefined,
      transactionsAsSecondParty: undefined,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
    };
  };

  static convertToProto = (
    value: SupplierPersona,
  ): Required<ProtoSupplierPersona> => {
    return {
      id: value.id,
      supplierPersonaId: value.supplierPersonaId,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
      organization: value.organization
        ? OrganizationProtoConverter.convertToProto(value.organization)
        : undefined,
    };
  };

  static convertToUpdatableApp = (
    value: ProtoUpdatableSupplierPersona,
  ): UpdatableSupplierPersona => {
    return {
      supplierPersonaId: value.supplierPersonaId,
    };
  };

  static convertToUpdatableProto = (
    value: UpdatableSupplierPersona,
  ): ProtoUpdatableSupplierPersona => {
    return {
      supplierPersonaId: value.supplierPersonaId,
    };
  };
}

class FactorPersonaProtoConverter {
  static convertToApp = (
    value: ProtoFactorPersona,
  ): Required<FactorPersona> => {
    return {
      id: value.id,
      factorPersonaId: value.factorPersonaId,
      organization: value.organization
        ? OrganizationProtoConverter.convertToApp(value.organization)
        : undefined,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
    };
  };

  static convertToProto = (
    value: FactorPersona,
  ): Required<ProtoFactorPersona> => {
    return {
      id: value.id,
      factorPersonaId: value.factorPersonaId,
      organization: value.organization
        ? OrganizationProtoConverter.convertToProto(value.organization)
        : undefined,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
    };
  };

  static convertToUpdatableApp = (
    value: ProtoUpdatableFactorPersona,
  ): UpdatableFactorPersona => {
    return {
      factorPersonaId: value.factorPersonaId,
    };
  };

  static convertToUpdatableProto = (
    value: UpdatableFactorPersona,
  ): ProtoUpdatableFactorPersona => {
    return {
      factorPersonaId: value.factorPersonaId,
    };
  };
}

class BankProviderEnumProtoConverter {
  static convertToApp = (value: ProtoBankProviderEnum): BankProviderEnum => {
    const map: Record<ProtoBankProviderEnum, BankProviderEnum | undefined> = {
      [ProtoBankProviderEnum.MAYBANK]: BankProviderEnum.MAYBANK,
      [ProtoBankProviderEnum.CIMB]: BankProviderEnum.CIMB,
      [ProtoBankProviderEnum.PUBLIC_BANK]: BankProviderEnum.PUBLIC_BANK,
      [ProtoBankProviderEnum.RHB]: BankProviderEnum.RHB,
      [ProtoBankProviderEnum.HONG_LEONG_BANK]: BankProviderEnum.HONG_LEONG_BANK,
      [ProtoBankProviderEnum.AMBANK]: BankProviderEnum.AMBANK,
      [ProtoBankProviderEnum.UOB]: BankProviderEnum.UOB,
      [ProtoBankProviderEnum.BANK_RAKYAT]: BankProviderEnum.BANK_RAKYAT,
      [ProtoBankProviderEnum.OCBC]: BankProviderEnum.OCBC,
      [ProtoBankProviderEnum.HSBC]: BankProviderEnum.HSBC,
      [ProtoBankProviderEnum.BANK_ISLAM]: BankProviderEnum.BANK_ISLAM,
      [ProtoBankProviderEnum.AFFIN_BANK]: BankProviderEnum.AFFIN_BANK,
      [ProtoBankProviderEnum.ALLIANCE_BANK]: BankProviderEnum.ALLIANCE_BANK,
      [ProtoBankProviderEnum.STANDARD_CHARTERED]:
        BankProviderEnum.STANDARD_CHARTERED,
      [ProtoBankProviderEnum.CITIBANK]: BankProviderEnum.CITIBANK,
      [ProtoBankProviderEnum.UNRECOGNIZED]: undefined,
    };

    return map[value];
  };

  static convertToProto = (value: BankProviderEnum): ProtoBankProviderEnum => {
    const map: Record<BankProviderEnum, ProtoBankProviderEnum> = {
      [BankProviderEnum.MAYBANK]: ProtoBankProviderEnum.MAYBANK,
      [BankProviderEnum.CIMB]: ProtoBankProviderEnum.CIMB,
      [BankProviderEnum.PUBLIC_BANK]: ProtoBankProviderEnum.PUBLIC_BANK,
      [BankProviderEnum.RHB]: ProtoBankProviderEnum.RHB,
      [BankProviderEnum.HONG_LEONG_BANK]: ProtoBankProviderEnum.HONG_LEONG_BANK,
      [BankProviderEnum.AMBANK]: ProtoBankProviderEnum.AMBANK,
      [BankProviderEnum.UOB]: ProtoBankProviderEnum.UOB,
      [BankProviderEnum.BANK_RAKYAT]: ProtoBankProviderEnum.BANK_RAKYAT,
      [BankProviderEnum.OCBC]: ProtoBankProviderEnum.OCBC,
      [BankProviderEnum.HSBC]: ProtoBankProviderEnum.HSBC,
      [BankProviderEnum.BANK_ISLAM]: ProtoBankProviderEnum.BANK_ISLAM,
      [BankProviderEnum.AFFIN_BANK]: ProtoBankProviderEnum.AFFIN_BANK,
      [BankProviderEnum.ALLIANCE_BANK]: ProtoBankProviderEnum.ALLIANCE_BANK,
      [BankProviderEnum.STANDARD_CHARTERED]:
        ProtoBankProviderEnum.STANDARD_CHARTERED,
      [BankProviderEnum.CITIBANK]: ProtoBankProviderEnum.CITIBANK,
    };

    return map[value];
  };
}

class BankAccountTypeEnumProtoConverter {
  static convertToApp = (
    value: ProtoBankAccountTypeEnum,
  ): BankAccountTypeEnum | undefined => {
    const map: Record<
      ProtoBankAccountTypeEnum,
      BankAccountTypeEnum | undefined
    > = {
      [ProtoBankAccountTypeEnum.CURRENT_ACCOUNT]:
        BankAccountTypeEnum.CURRENT_ACCOUNT,
      [ProtoBankAccountTypeEnum.SAVINGS_ACCOUNT]:
        BankAccountTypeEnum.SAVINGS_ACCOUNT,
      [ProtoBankAccountTypeEnum.MULTI_CURRENCY_ACCOUNT]:
        BankAccountTypeEnum.MULTI_CURRENCY_ACCOUNT,
      [ProtoBankAccountTypeEnum.FIXED_DEPOSIT_ACCOUNT]:
        BankAccountTypeEnum.FIXED_DEPOSIT_ACCOUNT,
      [ProtoBankAccountTypeEnum.UNRECOGNIZED]: undefined,
    };

    return map[value];
  };

  static convertToProto = (
    value: BankAccountTypeEnum,
  ): ProtoBankAccountTypeEnum => {
    const map: Record<BankAccountTypeEnum, ProtoBankAccountTypeEnum> = {
      [BankAccountTypeEnum.CURRENT_ACCOUNT]:
        ProtoBankAccountTypeEnum.CURRENT_ACCOUNT,
      [BankAccountTypeEnum.SAVINGS_ACCOUNT]:
        ProtoBankAccountTypeEnum.SAVINGS_ACCOUNT,
      [BankAccountTypeEnum.MULTI_CURRENCY_ACCOUNT]:
        ProtoBankAccountTypeEnum.MULTI_CURRENCY_ACCOUNT,
      [BankAccountTypeEnum.FIXED_DEPOSIT_ACCOUNT]:
        ProtoBankAccountTypeEnum.FIXED_DEPOSIT_ACCOUNT,
    };

    return map[value];
  };
}

class BankAccountProtoConverter {
  static convertToApp = (value: ProtoBankAccount): Required<BankAccount> => {
    return {
      id: value.id,
      bankProvider: BankProviderEnumProtoConverter.convertToApp(
        value.bankProvider,
      ),
      accountHolderName: value.accountHolderName,
      branchName: value.branchName,
      bankAddress: value.bankAddress,
      bankAccountNumber: value.bankAccountNumber,
      swiftCode: value.swiftCode,
      branchCode: value.branchCode,
      bankAccountType: BankAccountTypeEnumProtoConverter.convertToApp(
        value.bankAccountType,
      ),
      currency: CurrencyCodeEnumProtoConverter.convertToApp(value.currency),
      onlineBankAvailable: value.onlineBankAvailable,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
      organization: value.organization
        ? OrganizationProtoConverter.convertToApp(value.organization)
        : undefined,
      organizationId: value.organizationId,
      person: value.person
        ? PersonProtoConverter.convertToApp(value.person)
        : undefined,
      personId: value.personId,
    };
  };

  static convertToProto = (value: BankAccount): Required<ProtoBankAccount> => {
    return {
      id: value.id,
      bankProvider: BankProviderEnumProtoConverter.convertToProto(
        value.bankProvider,
      ),
      accountHolderName: value.accountHolderName,
      branchName: value.branchName,
      bankAddress: value.bankAddress,
      bankAccountNumber: value.bankAccountNumber,
      swiftCode: value.swiftCode,
      branchCode: value.branchCode,
      bankAccountType: BankAccountTypeEnumProtoConverter.convertToProto(
        value.bankAccountType,
      ),
      currency: CurrencyCodeEnumProtoConverter.convertToProto(value.currency),
      onlineBankAvailable: value.onlineBankAvailable,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
      organization: value.organization
        ? OrganizationProtoConverter.convertToProto(value.organization)
        : undefined,
      organizationId: value.organizationId,
      person: value.person
        ? PersonProtoConverter.convertToProto(value.person)
        : undefined,
      personId: value.personId,
    };
  };

  static convertToUpdatableApp = (
    value: ProtoUpdatableBankAccount,
  ): UpdatableBankAccount => {
    return {
      bankProvider: BankProviderEnumProtoConverter.convertToApp(
        value.bankProvider,
      ),
      accountHolderName: value.accountHolderName,
      branchName: value.branchName,
      bankAddress: value.bankAddress,
      bankAccountNumber: value.bankAccountNumber,
      swiftCode: value.swiftCode,
      branchCode: value.branchCode,
      bankAccountType: BankAccountTypeEnumProtoConverter.convertToApp(
        value.bankAccountType,
      ),
      currency: CurrencyCodeEnumProtoConverter.convertToApp(value.currency),
      onlineBankAvailable: value.onlineBankAvailable,
    };
  };

  static convertToUpdatableProto = (
    value: UpdatableBankAccount,
  ): ProtoUpdatableBankAccount => {
    return {
      bankProvider: BankProviderEnumProtoConverter.convertToProto(
        value.bankProvider,
      ),
      accountHolderName: value.accountHolderName,
      branchName: value.branchName,
      bankAddress: value.bankAddress,
      bankAccountNumber: value.bankAccountNumber,
      swiftCode: value.swiftCode,
      branchCode: value.branchCode,
      bankAccountType: BankAccountTypeEnumProtoConverter.convertToProto(
        value.bankAccountType,
      ),
      currency: CurrencyCodeEnumProtoConverter.convertToProto(value.currency),
      onlineBankAvailable: value.onlineBankAvailable,
    };
  };
}

export {
  BankAccountProtoConverter,
  ClientPersonaProtoConverter,
  ContractAwarderPersonaProtoConverter,
  FactorPersonaProtoConverter,
  OrganizationBusinessSectorEnumProtoConverter,
  OrganizationMalaysiaRegionEnumProtoConverter,
  OrganizationNatureOfBusinessEnumProtoConverter,
  OrganizationPersonProtoConverter,
  OrganizationPersonRoleEnumProtoConverter,
  OrganizationProtoConverter,
  OrganizationTypeEnumProtoConverter,
  PersonProtoConverter,
  SupplierPersonaProtoConverter,
};
