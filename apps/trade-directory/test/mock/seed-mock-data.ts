import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import {
  BankAccount,
  ClientPersona,
  ContractAwarderPersona,
  OrganizationPerson,
  PersonSupportingDocument,
} from 'apps/trade-directory/src/models';
import { OrganizationRepository } from 'apps/trade-directory/src/repositories';
import { Logger } from 'nestjs-pino';
import { mockBankAccount } from './bank-account.mock';
import { mockOrganizationPerson } from './organization-person.mock';
import { mockOrganization } from './organization.mock';
import { mockPersonSupportingDocument } from './person-supporting-document.mock';
import { mockPerson } from './person.mock';

const seedMockData = async (app: INestApplication): Promise<void> => {
  const logger = app.get(Logger);
  logger.log('Seeding mock data...');
  const organizationRepository = app.get(OrganizationRepository);

  for (let i = 0; i < 100; i++) {
    const numOfOrganizationPerson = faker.number.int({ min: 2, max: 8 });
    const organizationPersons: OrganizationPerson[] = [];
    for (let i = 0; i < numOfOrganizationPerson; i++) {
      const numOfPersonBankAccount = faker.number.int({ min: 1, max: 2 });
      const personBankAccounts: BankAccount[] = [];
      for (let i = 0; i < numOfPersonBankAccount; i++) {
        const bankAccount = mockBankAccount();
        personBankAccounts.push(bankAccount);
      }

      const numOfpersonSupportingDocument = faker.number.int({
        min: 1,
        max: 2,
      });
      const personSupportingDocuments: PersonSupportingDocument[] = [];
      for (let i = 0; i < numOfpersonSupportingDocument; i++) {
        const personSupportingDocument = mockPersonSupportingDocument({
          bucketKey: faker.lorem.word(),
        });
        personSupportingDocuments.push(personSupportingDocument);
      }

      const person = mockPerson({
        bankAccounts: personBankAccounts,
        personSupportingDocuments,
      });
      const organizationPerson = mockOrganizationPerson({
        person,
        organizationPersonRoles: [],
      });
      organizationPersons.push(organizationPerson);
    }

    const numOfOrganizationBankAccount = faker.number.int({ min: 2, max: 4 });
    const organizationBankAccounts: BankAccount[] = [];
    for (let i = 0; i < numOfOrganizationBankAccount; i++) {
      const bankAccount = mockBankAccount();
      organizationBankAccounts.push(bankAccount);
    }

    const organization = mockOrganization({
      organizationPersons: organizationPersons,
      bankAccounts: organizationBankAccounts,
    });

    const isClient = faker.datatype.boolean();
    if (isClient) {
      organization.clientPersona = new ClientPersona();
    }

    const isContractAwarder = faker.datatype.boolean({ probability: 0.2 });
    if (isContractAwarder) {
      organization.contractAwarderPersona = new ContractAwarderPersona();
    }

    await organizationRepository.save(organization);
    logger.log(`Organization ${i + 1} created`);
  }
};

export default seedMockData;
