import { ExperianReportSourceEnum } from '@app/common/apps/trade-directory/enums/experian-report-source.enum';
import { ExperianReportStatusEnum } from '@app/common/apps/trade-directory/enums/experian-report-status.enum';
import { ExperianReportTypeEnum } from '@app/common/apps/trade-directory/enums/experian-report-type.enum';
import { OrganizationTypeEnum } from '@app/common/apps/trade-directory/enums/organization-type.enum';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import {
  ClientPersona,
  ContractAwarderPersona,
  Experian,
  Organization,
  OrganizationPerson,
  Person,
  SupplierPersona,
} from '../models';
import {
  ClientPersonaRepository,
  ContractAwarderPersonaRepository,
  ExperianRepository,
  OrganizationPersonRepository,
  OrganizationRepository,
  PersonRepository,
  SupplierPersonaRepository,
} from '../repositories';
import { TradeDirectoryModule } from '../trade-directory.module';
import * as json from './data/ebi.json';

async function bootstrap() {
  const app = await NestFactory.create(TradeDirectoryModule);
  app.useLogger(app.get(Logger));
  const logger = app.get(Logger);

  logger.log(
    `Seeding Experian ${ExperianReportTypeEnum.ENHANCED_BUSINESS_INTELLIGENCE} report...`,
  );
  const experianRepository = app.get(ExperianRepository);
  const organizationRepository = app.get(OrganizationRepository);
  const clientPersonaRepository = app.get(ClientPersonaRepository);
  const contractAwarderPersonaRepository = app.get(
    ContractAwarderPersonaRepository,
  );
  const supplierPersonaRepository = app.get(SupplierPersonaRepository);
  const personRepository = app.get(PersonRepository);
  const organizationPersonRepository = app.get(OrganizationPersonRepository);
  const data = json;
  for (const datum of data) {
    logger.log(
      `Seeding experian data for registration number: ${datum['Registration No']}...`,
    );
    const experianSeed = new Experian({
      reportType: ExperianReportTypeEnum.ENHANCED_BUSINESS_INTELLIGENCE,
      reportStatus: ExperianReportStatusEnum.SUCCESS,
      reportSource: ExperianReportSourceEnum.PHYSICAL_COPY,
      registrationNumber: datum['Registration No'],
      companyName: datum['Company Name'],
      incorporationDate: new Date(datum['Incorporation Date']),
      status: datum.Status,
      registeredAddress: datum['Registered Address'].map((a) => ({
        address: a.Address,
        dateCaptured: a['Date Captured'],
      })),
      businessConstitution: datum['Business Constitution'],
      businessAddress: datum['Business Address'],
      businessSector: datum['Business Sector'],
      principalActivity: datum['Principal Activity'],
      managementDetails: datum['Management Details'].map((m) => ({
        name: m.Name,
        address: m.Address,
        localNumber: m['IC/PP/Local No'],
        designation: m.Designation,
        appointmentDate: m['Appointment Date'],
        withdrawnDate: m['Withdrawn Date'],
        remark: m.Remark,
      })),
      legalSuitsSubjectAsDefendant: datum[
        'LEGAL SUITS - SUBJECT AS DEFENDANT'
      ].map((l) => ({
        defendantName: l['Defendant Name'],
        defendantLocalNumber: l['Defendant Local No.'],
        plaintiffName: l.Plantiff,
        plaintiffLocalNumber: l['Plaintiff Local No.'],
        caseStatus: l['Case Status'],
        hearingDate: l['Hearing Date'],
        suitRef: l['Suit Ref.'],
      })),
      legalSuitsSubjectAsPlaintiff: datum[
        'LEGAL SUITS - SUBJECT AS PLAINTIFF'
      ].map((l) => ({
        plaintiffName: l['Plaintiff Name'],
        plaintiffLocalNumber: l['Plaintiff Local No.'],
        caseStatus: l['Case Status'],
        hearingDate: l['Hearing Date'],
        suitRef: l['Suit Ref.'],
      })),
    });
    const experian = await experianRepository.upsert(
      {
        companyName: experianSeed.companyName,
        reportType: experianSeed.reportType,
        reportSource: experianSeed.reportSource,
      },
      experianSeed,
    );

    const organizationType = organizationTypeConverter(
      experian.businessConstitution,
    );
    const organizationSeed = new Organization({
      organizationName: experian.companyName,
      organizationType:
        organizationType === null
          ? OrganizationTypeEnum.OTHERS
          : organizationType,
      organizationTypeOther: organizationType === null ? experian.type : null,
      businessRegistrationNumber: experian.registrationNumber,
      experianBusinessSector: experian.businessSector,
      incorporationDate: experian.incorporationDate,
      businessAddress: experian.businessAddress,
      registeredAddress: findMostRecentAddress(experian.registeredAddress)
        .address,
    });
    const organization = await organizationRepository.upsert(
      {
        organizationName: experian.companyName,
      },
      organizationSeed,
    );

    experian.organization = organization;
    await experianRepository.save(experian);

    for (const managementDetail of experian.managementDetails) {
      const personSeed = new Person({
        name: managementDetail.name,
        residentialAddress: managementDetail.address,
        identificationNumber: managementDetail.localNumber,
      });
      const person = await personRepository.upsert(
        {
          identificationNumber: managementDetail.localNumber,
        },
        personSeed,
      );
      const organizationPersonSeed = new OrganizationPerson({
        organization: organization,
        person: person,
        designation: managementDetail.designation,
      });
      await organizationPersonRepository.upsert(
        {
          organization: {
            id: organization.id,
          },
          person: {
            id: person.id,
          },
        },
        organizationPersonSeed,
      );
    }

    if (!Array.isArray(datum.role)) {
      continue;
    }

    if (datum.role.includes('Client')) {
      const clientPersonaSeed = new ClientPersona({
        organization: organization,
      });
      await clientPersonaRepository.upsert(
        {
          organization: {
            id: organization.id,
          },
        },
        clientPersonaSeed,
      );
    }

    if (datum.role.includes('Contract Awarder')) {
      const contractAwarderPersonaSeed = new ContractAwarderPersona({
        organization: organization,
      });
      await contractAwarderPersonaRepository.upsert(
        {
          organization: {
            id: organization.id,
          },
        },
        contractAwarderPersonaSeed,
      );
    }

    if (datum.role.includes('Supplier')) {
      const supplierPersonaSeed = new SupplierPersona({
        organization: organization,
      });
      await supplierPersonaRepository.upsert(
        {
          organization: {
            id: organization.id,
          },
        },
        supplierPersonaSeed,
      );
    }
  }
}
bootstrap();

type RegisteredAddress = {
  address?: string;
  dateCaptured?: string;
};
function findMostRecentAddress(
  addresses: RegisteredAddress[],
): RegisteredAddress | null {
  let mostRecent: RegisteredAddress | null = null;
  let mostRecentDate: Date | null = null;

  for (const address of addresses) {
    if (address.dateCaptured) {
      const capturedDate = new Date(address.dateCaptured);
      if (!mostRecent || capturedDate > mostRecentDate!) {
        mostRecent = address;
        mostRecentDate = capturedDate;
      }
    }
  }

  return mostRecent;
}

function organizationTypeConverter(
  value: string | number | null,
): OrganizationTypeEnum | null {
  if (value === null) {
    return null;
  }

  if (typeof value === 'number') {
    return null;
  }
  const organizationTypeValue = value.toUpperCase();

  if (organizationTypeValue.includes('PUBLIC LIMITED')) {
    return OrganizationTypeEnum.PUBLIC_LIMITED;
  }

  if (organizationTypeValue.includes('PRIVATE LIMITED')) {
    return OrganizationTypeEnum.PRIVATE_LIMITED;
  }

  if (organizationTypeValue.includes('PARTNERSHIP')) {
    return OrganizationTypeEnum.PARTNERSHIP;
  }

  if (organizationTypeValue.includes('PROPRIETORSHIP')) {
    return OrganizationTypeEnum.SOLE_PROPRIETORSHIP;
  }

  return null;
}
