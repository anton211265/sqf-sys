import { ClientAwarderContractAssignmentMethodEnum } from '@app/common/apps/risk-operation/enums/client-awarder-contract-assignment-method.enum';
import { ClientAwarderContractCollectionMethodEnum } from '@app/common/apps/risk-operation/enums/client-awarder-contract-collection-method.enum';
import { ClientAwarderContractFundingChannelEnum } from '@app/common/apps/risk-operation/enums/client-awarder-contract-funding-channel.enum';
import { ClientAwarderContractNatureEnum } from '@app/common/apps/risk-operation/enums/client-awarder-contract-nature.enum';
import { ClientAwarderContractTypeEnum } from '@app/common/apps/risk-operation/enums/client-awarder-contract-type.enum';
import { CurrencyCodeEnum } from '@app/common/constants/currencies';
import { faker } from '@faker-js/faker';
import {
  ClientAwarderContract,
  ClientAwarderContractVariationOrder,
} from 'apps/risk-operation/src/models';
import {
  Organization,
  OrganizationPerson,
  Person,
} from 'apps/trade-directory/src/models';

const mockClientAwarderContract = (args: {
  dateContext: Date;
  clientOrganization: Organization;
  contractAwarder: {
    organization: Organization;
    personInCharge: {
      person: Person;
      organizationPerson: OrganizationPerson;
    }[];
    keyManagementPersonnel: {
      person: Person;
      organizationPerson: OrganizationPerson;
    }[];
  };
  supplier: {
    organization: Organization;
    personInCharge: {
      person: Person;
      organizationPerson: OrganizationPerson;
    }[];
  }[];
}): ClientAwarderContract => {
  const contractType = faker.helpers.enumValue(ClientAwarderContractTypeEnum);
  const contractStartDate = faker.date.soon({
    refDate: args.dateContext,
  });
  const contractEndDate = faker.date.future();
  const totalContractValue = faker.number.int({ max: 10000000 });

  const numOfVariationOrder = faker.number.int({ min: 0, max: 3 });
  const variationOrders: ClientAwarderContractVariationOrder[] = [];
  for (let k = 0; k < numOfVariationOrder; k++) {
    const variationOrder: ClientAwarderContractVariationOrder = {
      variationOrderStartDate: faker.date.soon({
        refDate: args.dateContext,
      }),
      variationOrderEndDate: faker.date.future({
        refDate: contractEndDate,
      }),
      variationOrderValue: faker.number.int({ max: 1000 }),
      variationOrderCurrency: CurrencyCodeEnum.MYR,
    };
    variationOrders.push(variationOrder);
  }

  const clientAwarderContract = new ClientAwarderContract({
    contractTitle: faker.lorem.sentence(),
    contractNumber: faker.string.alphanumeric(8),
    contractType,
    contractTypeOther:
      contractType === ClientAwarderContractTypeEnum.OTHERS
        ? faker.lorem.sentence()
        : undefined,
    contractNature: faker.helpers.enumValue(ClientAwarderContractNatureEnum),
    contractStatus: faker.lorem.sentence(),
    assignmentMethod: faker.helpers.enumValue(
      ClientAwarderContractAssignmentMethodEnum,
    ),
    fundingChannel: faker.helpers.enumValue(
      ClientAwarderContractFundingChannelEnum,
    ),
    collectionMethod: faker.helpers.enumValue(
      ClientAwarderContractCollectionMethodEnum,
    ),
    contractStartDate,
    contractEndDate,
    extensionOfTenure: faker.date.future({ refDate: contractEndDate }),
    contractSigningDate: faker.date.recent({ refDate: contractStartDate }),
    totalContractValue: totalContractValue,
    totalContractValueClaimed: faker.number.int({
      max: totalContractValue * 0.8,
    }),
    totalContractValueCurrency: CurrencyCodeEnum.MYR,
    variationOrders,
    remark: faker.lorem.sentence(),
    clientPersonaId: args.clientOrganization.id,
    clientOrganizationName: args.clientOrganization.organizationName,
    contractAwarder: {
      organization: {
        organizationName: args.contractAwarder.organization.organizationName,
        alias: args.contractAwarder.organization.alias,
        country: args.contractAwarder.organization.country,
        organizationType: args.contractAwarder.organization.organizationType,
        organizationTypeOther:
          args.contractAwarder.organization.organizationTypeOther,
        businessRegistrationNumber:
          args.contractAwarder.organization.businessRegistrationNumber,
        taxIdentificationNumber:
          args.contractAwarder.organization.taxIdentificationNumber,
        sstRegistrationNumber:
          args.contractAwarder.organization.sstRegistrationNumber,
        businessSector: args.contractAwarder.organization.businessSector,
        natureOfBusiness: args.contractAwarder.organization.natureOfBusiness,
        coreBusiness: args.contractAwarder.organization.coreBusiness,
        incorporationDate: args.contractAwarder.organization.incorporationDate,
        operationStartDate:
          args.contractAwarder.organization.operationStartDate,
        businessAddress: args.contractAwarder.organization.businessAddress,
        registeredAddress: args.contractAwarder.organization.registeredAddress,
        malaysiaRegion: args.contractAwarder.organization.malaysiaRegion,
        factoryAddress: args.contractAwarder.organization.factoryAddress,
        organizationWebsite:
          args.contractAwarder.organization.organizationWebsite,
        organizationLogo: args.contractAwarder.organization.organizationLogo,
      },
      personInCharge: args.contractAwarder.personInCharge.map((pic) => ({
        person: {
          name: pic.person.name,
          residentialAddress: pic.person.residentialAddress,
          identificationNumber: pic.person.identificationNumber,
          mobileNumber: pic.person.mobileNumber,
          email: pic.person.email,
        },
        organizationPerson: {
          designation: pic.organizationPerson.designation,
        },
      })),
      keyManagementPersonnel: args.contractAwarder.keyManagementPersonnel.map(
        (kmp) => ({
          person: {
            name: kmp.person.name,
            residentialAddress: kmp.person.residentialAddress,
            identificationNumber: kmp.person.identificationNumber,
            mobileNumber: kmp.person.mobileNumber,
            email: kmp.person.email,
          },
          organizationPerson: {
            designation: kmp.organizationPerson.designation,
          },
        }),
      ),
    },
    suppliers: args.supplier.map((supplier) => ({
      organization: {
        organizationName: supplier.organization.organizationName,
        alias: supplier.organization.alias,
        country: supplier.organization.country,
        organizationType: supplier.organization.organizationType,
        organizationTypeOther: supplier.organization.organizationTypeOther,
        businessRegistrationNumber:
          supplier.organization.businessRegistrationNumber,
        taxIdentificationNumber: supplier.organization.taxIdentificationNumber,
        sstRegistrationNumber: supplier.organization.sstRegistrationNumber,
        businessSector: supplier.organization.businessSector,
        natureOfBusiness: supplier.organization.natureOfBusiness,
        coreBusiness: supplier.organization.coreBusiness,
        incorporationDate: supplier.organization.incorporationDate,
        operationStartDate: supplier.organization.operationStartDate,
        businessAddress: supplier.organization.businessAddress,
        registeredAddress: supplier.organization.registeredAddress,
        malaysiaRegion: supplier.organization.malaysiaRegion,
        factoryAddress: supplier.organization.factoryAddress,
        organizationWebsite: supplier.organization.organizationWebsite,
        organizationLogo: supplier.organization.organizationLogo,
      },
      personInCharge: supplier.personInCharge.map((pic) => ({
        person: {
          name: pic.person.name,
          residentialAddress: pic.person.residentialAddress,
          identificationNumber: pic.person.identificationNumber,
          mobileNumber: pic.person.mobileNumber,
          email: pic.person.email,
        },
        organizationPerson: {
          designation: pic.organizationPerson.designation,
        },
      })),
    })),
  });

  return clientAwarderContract;
};

export { mockClientAwarderContract };
