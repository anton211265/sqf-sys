import { faker } from '@faker-js/faker';
import {
  BankAccount,
  Person,
  PersonSupportingDocument,
} from 'apps/trade-directory/src/models';

const mockPerson = (args: {
  bankAccounts: BankAccount[];
  personSupportingDocuments: PersonSupportingDocument[];
}): Person => {
  const sex = faker.person.sexType();
  const firstName = faker.person.firstName(sex);
  const lastName = faker.person.lastName(sex);

  const person = new Person({
    name: faker.person.fullName({ firstName, lastName }),
    preferredUsername: faker.internet.userName({ firstName, lastName }),
    residentialAddress: faker.location.streetAddress(true),
    identificationNumber: faker.string.uuid(),
    mobileNumber: faker.phone.number(),
    email: faker.internet.email({ firstName, lastName }),
    bankAccounts: args.bankAccounts,
    personSupportingDocuments: args.personSupportingDocuments,
  });

  return person;
};

export { mockPerson };
