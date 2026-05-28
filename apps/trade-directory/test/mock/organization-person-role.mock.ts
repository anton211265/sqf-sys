import { OrganizationPersonRoleEnum } from '@app/common/apps/trade-directory/enums/organization-person-role.enum';
import { faker } from '@faker-js/faker';
import { OrganizationPersonRole } from 'apps/trade-directory/src/models';

const mockOrganizationPersonRole = (): OrganizationPersonRole => {
  const organizationPersonRole = new OrganizationPersonRole({
    role: faker.helpers.enumValue(OrganizationPersonRoleEnum),
  });

  return organizationPersonRole;
};

export { mockOrganizationPersonRole };
