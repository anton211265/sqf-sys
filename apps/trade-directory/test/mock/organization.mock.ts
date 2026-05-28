import { OrganizationBusinessSectorEnum } from '@app/common/apps/trade-directory/enums/organization-business-sector.enum';
import { OrganizationMalaysiaRegionEnum } from '@app/common/apps/trade-directory/enums/organization-malaysia-region.enum';
import { OrganizationNatureOfBusinessEnum } from '@app/common/apps/trade-directory/enums/organization-nature-of-business.enum';
import { OrganizationTypeEnum } from '@app/common/apps/trade-directory/enums/organization-type.enum';
import { CountryCodeEnum } from '@app/common/constants/countries';
import { faker } from '@faker-js/faker';
import {
  BankAccount,
  Organization,
  OrganizationPerson,
} from 'apps/trade-directory/src/models';

const mockOrganization = (args: {
  organizationPersons: OrganizationPerson[];
  bankAccounts: BankAccount[];
}): Organization => {
  const organizationName = faker.company.name();
  const organizationType = faker.helpers.enumValue(OrganizationTypeEnum);
  const incorporationDate = faker.date.past();
  const organization = new Organization({
    organizationPersons: args.organizationPersons,
    organizationName,
    alias: organizationName.substring(0, 3).toUpperCase(),
    country: faker.helpers.enumValue(CountryCodeEnum),
    organizationType,
    organizationTypeOther:
      organizationType === OrganizationTypeEnum.OTHERS
        ? faker.company.buzzPhrase()
        : undefined,
    businessRegistrationNumber: faker.string.uuid(),
    taxIdentificationNumber: faker.string.uuid(),
    sstRegistrationNumber: faker.string.uuid(),
    businessSector: faker.helpers.enumValue(OrganizationBusinessSectorEnum),
    natureOfBusiness: faker.helpers.enumValue(OrganizationNatureOfBusinessEnum),
    coreBusiness: faker.company.buzzPhrase(),
    incorporationDate,
    operationStartDate: faker.date.soon({ refDate: incorporationDate }),
    businessAddress: faker.location.streetAddress(true),
    registeredAddress: faker.location.streetAddress(true),
    malaysiaRegion: faker.helpers.enumValue(OrganizationMalaysiaRegionEnum),
    factoryAddress: faker.location.streetAddress(true),
    organizationWebsite: faker.internet.url(),
    organizationLogo: faker.image.url(),
    bankAccounts: args.bankAccounts,
  });

  return organization;
};

export { mockOrganization };
