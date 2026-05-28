import { ApplicationStatusEnum } from '@app/common/apps/risk-operation/enums/application-status.enum';
import { LeadSourceEnum } from '@app/common/apps/risk-operation/enums/lead-source.enum';
import { faker } from '@faker-js/faker';
import {
  Application,
  ApplicationPublic,
  ApplicationSupportingDocument,
  ClientAwarderContract,
  Facility,
} from 'apps/risk-operation/src/models';
import {
  BankAccount,
  Organization,
  OrganizationPerson,
  Person,
} from 'apps/trade-directory/src/models';

const mockApplication = (args: {
  clientOrganization: Organization;
  clientContactPersons: {
    person: Person;
    organizationPerson: OrganizationPerson;
  }[];
  clientBankAccounts: BankAccount[];
  clientPersonInCharge: {
    person: Person;
    organizationPerson: OrganizationPerson;
  }[];
  clientAwarderContract: ClientAwarderContract;
  directors: {
    person: Person;
    organizationPerson: OrganizationPerson;
  }[];
  nextOfKins: {
    person: Person;
    organizationPerson: OrganizationPerson;
  }[];
  corporateGuarantors: Organization[];
  factorPersonaId: number;
  creatorPersonId: number;
  assigneePersonId: number;
  facilities: Facility[];
  applicationPublics: ApplicationPublic[];
  applicationSupportingDocuments: ApplicationSupportingDocument[];
}): Application => {
  const application = new Application({
    applicationDate: faker.date.recent(),
    applicationStatus: faker.helpers.enumValue(ApplicationStatusEnum),
    leadSource: faker.helpers.enumValue(LeadSourceEnum),
    clientPersonaId: args.clientOrganization.clientPersonaId,
    clientOrganizationName: args.clientOrganization.organizationName,
    clientContactPersons: args.clientContactPersons.map((ccp) => ({
      person: {
        name: ccp.person.name,
        residentialAddress: ccp.person.residentialAddress,
        identificationNumber: ccp.person.identificationNumber,
        mobileNumber: ccp.person.mobileNumber,
        email: ccp.person.email,
      },
      organizationPerson: {
        designation: ccp.organizationPerson.designation,
      },
    })),
    clientBankAccounts: args.clientBankAccounts.map((cba) => ({
      escrow: faker.datatype.boolean({ probability: 0.5 }),
      preferred: faker.datatype.boolean({ probability: 0.5 }),
      bankAccount: {
        bankProvider: cba.bankProvider,
        accountHolderName: cba.accountHolderName,
        branchName: cba.branchName,
        bankAddress: cba.bankAddress,
        bankAccountNumber: cba.bankAccountNumber,
        swiftCode: cba.swiftCode,
        branchCode: cba.branchCode,
        bankAccountType: cba.bankAccountType,
        currency: cba.currency,
        onlineBankAvailable: cba.onlineBankAvailable,
      },
    })),
    clientPersonInCharge: args.clientPersonInCharge.map((cpic) => ({
      person: {
        name: cpic.person.name,
        residentialAddress: cpic.person.residentialAddress,
        identificationNumber: cpic.person.identificationNumber,
        mobileNumber: cpic.person.mobileNumber,
        email: cpic.person.email,
      },
      organizationPerson: {
        designation: cpic.organizationPerson.designation,
      },
    })),
    clientAwarderContract: args.clientAwarderContract,
    directors: args.directors.map((d) => ({
      person: {
        name: d.person.name,
        residentialAddress: d.person.residentialAddress,
        identificationNumber: d.person.identificationNumber,
        mobileNumber: d.person.mobileNumber,
        email: d.person.email,
      },
      organizationPerson: {
        designation: d.organizationPerson.designation,
      },
    })),
    nextOfKins: args.nextOfKins.map((nok) => ({
      person: {
        name: nok.person.name,
        residentialAddress: nok.person.residentialAddress,
        identificationNumber: nok.person.identificationNumber,
        mobileNumber: nok.person.mobileNumber,
        email: nok.person.email,
      },
      organizationPerson: {
        designation: nok.organizationPerson.designation,
      },
    })),
    corporateGuarantors: args.corporateGuarantors.map((cg) => ({
      organization: {
        organizationName: cg.organizationName,
        alias: cg.alias,
        country: cg.country,
        organizationType: cg.organizationType,
        organizationTypeOther: cg.organizationTypeOther,
        businessRegistrationNumber: cg.businessRegistrationNumber,
        taxIdentificationNumber: cg.taxIdentificationNumber,
        sstRegistrationNumber: cg.sstRegistrationNumber,
        businessSector: cg.businessSector,
        natureOfBusiness: cg.natureOfBusiness,
        coreBusiness: cg.coreBusiness,
        incorporationDate: cg.incorporationDate,
        operationStartDate: cg.operationStartDate,
        businessAddress: cg.businessAddress,
        registeredAddress: cg.registeredAddress,
        malaysiaRegion: cg.malaysiaRegion,
        factoryAddress: cg.factoryAddress,
        organizationWebsite: cg.organizationWebsite,
        organizationLogo: cg.organizationLogo,
      },
    })),
    remark: faker.lorem.sentence(),
    numberOfContractSecured: faker.number.int({ max: 100 }),
    valueOfContractSecured: faker.number.float({ max: 10000000 }),
    applicationFee: faker.number.float({ max: 10000 }),
    latePaymentCharges: faker.number.float({ max: 1 }),
    administrationFee: faker.number.float({ max: 1 }),
    processingFee: faker.number.float({ max: 1 }),
    remittanceCharges: faker.number.float({ max: 1000 }),
    collectionFee: faker.number.float({ max: 1000 }),
    eMandateFee: faker.number.float({ max: 1000 }),
    facilityFee: faker.number.float({ max: 1000 }),
    supportLetterCharges: faker.number.float({ max: 1000 }),
    letterOfUndertakingCharges: faker.number.float({ max: 1000 }),
    bankGuaranteeServiceFee: faker.number.float({ max: 1000 }),
    letterOfCreditServiceFee: faker.number.float({ max: 1000 }),
    customerRetention: faker.number.float({ max: 1000 }),
    financialAdvisory: faker.number.float({ max: 1000 }),
    retainerFee: faker.number.float({ max: 1000 }),
    arrangerFee: faker.number.float({ max: 1000 }),
    stampingFee: faker.number.float({ max: 1000 }),
    sinkingFund: faker.number.float({ max: 1000 }),
    approvalFee: faker.number.float({ max: 1000 }),
    factorPersonaId: args.factorPersonaId,
    creatorPersonId: args.creatorPersonId,
    assigneePersonId: args.assigneePersonId,
    facilities: args.facilities,
    applicationPublics: args.applicationPublics,
    applicationSupportingDocuments: args.applicationSupportingDocuments,
  });

  return application;
};

export { mockApplication };
