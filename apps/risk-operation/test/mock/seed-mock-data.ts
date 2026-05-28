import { OrganizationPersonRoleEnum } from '@app/common/apps/trade-directory/enums/organization-person-role.enum';
import { OrganizationProtoConverter } from '@app/common/apps/trade-directory/proto-converter';
import {
  ORGANIZATION_GRPC_SERVICE_NAME,
  OrganizationGrpcServiceClient,
} from '@app/common/apps/trade-directory/proto/organization';
import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  ApplicationPublic,
  ApplicationSupportingDocument,
  Facility,
} from 'apps/risk-operation/src/models';
import { ApplicationRepository } from 'apps/risk-operation/src/repositories';
import { Logger } from 'nestjs-pino';
import { firstValueFrom } from 'rxjs';
import { mockApplicationPublic } from './application-public.mock';
import { mockApplicationSupportingDocument } from './application-supporting-document.mock';
import { mockApplication } from './application.mock';
import { mockClientAwarderContract } from './client-awarder-contract.mock';
import { mockFacility } from './facility.mock';

const seedMockData = async (app: INestApplication): Promise<void> => {
  const logger = app.get(Logger);
  logger.log('Seeding mock data...');
  const applicationRepository = app.get(ApplicationRepository);

  const tradeDirectoryGrpcClient = app.get<ClientGrpc>(
    DependencyInjectionTokenEnum.TRADE_DIRECTORY_GRPC_CLIENT,
  );
  const organizationGrpcService =
    tradeDirectoryGrpcClient.getService<OrganizationGrpcServiceClient>(
      ORGANIZATION_GRPC_SERVICE_NAME,
    );

  const { organizations: protoOrganizations } = await firstValueFrom(
    organizationGrpcService.getAllGrpc({
      includeClientPersona: {
        value: true,
      },
      includeContractAwarderPersona: {
        value: true,
      },
      includeOrganizationPerson: {
        value: true,
        includePerson: {
          value: true,
        },
      },
      includeBankAccount: {
        value: true,
      },
    }),
  );

  const organizations = protoOrganizations.map((protoOrganization) =>
    OrganizationProtoConverter.convertToApp(protoOrganization),
  );

  const clientOrganizations = organizations.filter(
    (organization) =>
      organization.clientPersona &&
      organization.bankAccounts.length > 0 &&
      organization.organizationPersons.length > 0,
  );

  if (clientOrganizations.length === 0) {
    throw new Error('No suitable client organization found');
  }

  const contractAwarderOrganizations = organizations.filter(
    (organization) => organization.contractAwarderPersona,
  );

  const {
    organizations: [protoFactorOrganization],
  } = await firstValueFrom(
    organizationGrpcService.findByFactorPersonaIdGrpc({
      factorPersonaId: [1],
      includeOrganizationPerson: {
        value: true,
        includePerson: {
          value: true,
        },
        includeOrganizationPersonRole: {
          value: true,
        },
      },
    }),
  );

  if (!protoFactorOrganization) {
    throw new Error('Factor organization not found');
  }

  const factorOrganization = OrganizationProtoConverter.convertToApp(
    protoFactorOrganization,
  );

  for (let i = 0; i < 40; i++) {
    const dateContext = faker.date.past();
    const clientOrganization = faker.helpers.arrayElement(clientOrganizations);
    const clientOrganizationPersonInCharge = faker.helpers.arrayElements(
      clientOrganization.organizationPersons,
      { min: 1, max: 3 },
    );

    const contractAwarderOrganization = faker.helpers.arrayElement(
      contractAwarderOrganizations.filter(
        (organization) => organization.id !== clientOrganization.id,
      ),
    );

    const contractAwarderOrganizationPersonInCharge =
      faker.helpers.arrayElements(
        contractAwarderOrganization.organizationPersons,
        { min: 1, max: 3 },
      );

    const clientAwarderContract = mockClientAwarderContract({
      dateContext,
      clientOrganization,
      contractAwarder: {
        organization: contractAwarderOrganization,
        personInCharge: contractAwarderOrganizationPersonInCharge.map(
          (pic) => ({
            person: pic.person,
            organizationPerson: pic,
          }),
        ),
        keyManagementPersonnel: contractAwarderOrganizationPersonInCharge.map(
          (pic) => ({
            person: pic.person,
            organizationPerson: pic,
          }),
        ),
      },
      supplier: [],
    });

    const selectedCorporateGuarantors = faker.helpers.arrayElements(
      organizations.filter(
        (organization) => organization.id !== clientOrganization.id,
      ),
      { min: 0, max: 2 },
    );

    const relationshipManagers = factorOrganization.organizationPersons.filter(
      (organizationPerson) =>
        organizationPerson.organizationPersonRoles.some(
          (organizationPersonRole) =>
            organizationPersonRole.role ===
            OrganizationPersonRoleEnum.CLIENT_COVERAGE,
        ),
    );

    const creatorPersonId =
      faker.helpers.arrayElement(relationshipManagers).person.id;

    const numOfFacility = faker.number.int({
      min: 1,
      max: 3,
    });
    const facilities: Facility[] = [];
    for (let j = 0; j < numOfFacility; j++) {
      const facility = mockFacility({ dateContext });
      facilities.push(facility);
    }

    const numOfapplicationPublic = faker.number.int({
      min: 1,
      max: 3,
    });
    const applicationPublics: ApplicationPublic[] = [];
    for (let j = 0; j < numOfapplicationPublic; j++) {
      const applicationPublic = mockApplicationPublic({
        dateContext,
      });
      applicationPublics.push(applicationPublic);
    }

    const numOfApplicationSupportingDocument = faker.number.int({
      min: 1,
      max: 3,
    });
    const applicationSupportingDocuments: ApplicationSupportingDocument[] = [];
    for (let j = 0; j < numOfApplicationSupportingDocument; j++) {
      const applicationSupportingDocument = mockApplicationSupportingDocument({
        bucketKey: faker.lorem.word(),
      });
      applicationSupportingDocuments.push(applicationSupportingDocument);
    }

    const application = mockApplication({
      clientOrganization,
      clientContactPersons: clientOrganizationPersonInCharge.map((pic) => ({
        person: pic.person,
        organizationPerson: pic,
      })),
      clientBankAccounts: clientOrganization.bankAccounts,
      clientPersonInCharge: clientOrganizationPersonInCharge.map((pic) => ({
        person: pic.person,
        organizationPerson: pic,
      })),
      clientAwarderContract,
      directors: clientOrganizationPersonInCharge.map((pic) => ({
        person: pic.person,
        organizationPerson: pic,
      })),
      nextOfKins: clientOrganizationPersonInCharge.map((pic) => ({
        person: pic.person,
        organizationPerson: pic,
      })),
      factorPersonaId: factorOrganization.factorPersona.id,
      creatorPersonId,
      assigneePersonId: creatorPersonId,
      corporateGuarantors: selectedCorporateGuarantors,
      facilities,
      applicationPublics,
      applicationSupportingDocuments,
    });

    await applicationRepository.save(application);
    logger.log(`Application ${i + 1} created`);
  }
};

export default seedMockData;
