import { faker } from '@faker-js/faker';
import {
  OrganizationPerson,
  OrganizationPersonRole,
  Person,
} from 'apps/trade-directory/src/models';

const mockOrganizationPerson = (args: {
  person: Person;
  organizationPersonRoles: OrganizationPersonRole[];
}): OrganizationPerson => {
  const organizationPerson = new OrganizationPerson({
    person: args.person,
    designation: faker.person.jobTitle(),
    sub: faker.string.uuid(),
    organizationPersonRoles: args.organizationPersonRoles,
  });

  return organizationPerson;
};

export { mockOrganizationPerson };
