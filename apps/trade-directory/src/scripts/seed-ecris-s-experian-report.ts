import { KycReportSourceEnum } from '@app/common/apps/trade-directory/enums/kyc-report-source.enum';
import { KycReportStatusEnum } from '@app/common/apps/trade-directory/enums/kyc-report-status.enum';
import { KycReportTypeEnum } from '@app/common/apps/trade-directory/enums/kyc-report-type.enum';
import { OrganizationTypeEnum } from '@app/common/apps/trade-directory/enums/organization-type.enum';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import {
  ClientPersona,
  BuyerPersona,
  KycAgencyReport,
  Organization,
  OrganizationPerson,
  Person,
  SupplierPersona,
} from '../models';
import {
  ClientPersonaRepository,
  BuyerPersonaRepository,
  KycAgencyReportRepository,
  OrganizationPersonRepository,
  OrganizationRepository,
  PersonRepository,
  SupplierPersonaRepository,
} from '../repositories';
import { TradeDirectoryModule } from '../trade-directory.module';
import * as ecrissJson from './data/ecris-s.json';
import * as ecrisJson from './data/ecris.json';

async function bootstrap() {
  const app = await NestFactory.create(TradeDirectoryModule);
  app.useLogger(app.get(Logger));
  const logger = app.get(Logger);

  logger.log(
    `Seeding KycAgencyReport ${KycReportTypeEnum.ENHANCED_C_RISK_SCORE_INTELLIGENCE} report...`,
  );
  const kycAgencyReportRepository = app.get(KycAgencyReportRepository);
  const organizationRepository = app.get(OrganizationRepository);
  const clientPersonaRepository = app.get(ClientPersonaRepository);
  const buyerPersonaRepository = app.get(
    BuyerPersonaRepository,
  );
  const supplierPersonaRepository = app.get(SupplierPersonaRepository);
  const personRepository = app.get(PersonRepository);
  const organizationPersonRepository = app.get(OrganizationPersonRepository);
  const data = [...ecrisJson, ...ecrissJson];
  for (const datum of data) {
    logger.log(
      `Seeding kycReport data for registration number: ${datum['Registration No']}...`,
    );
    const kycReportSeed = new KycAgencyReport({
      reportType: KycReportTypeEnum.ENHANCED_C_RISK_SCORE_INTELLIGENCE,
      reportStatus: KycReportStatusEnum.SUCCESS,
      reportSource: KycReportSourceEnum.PHYSICAL_COPY,
      registrationNumber: datum['Registration No'],
      companyName: datum['Company Name'],
      type: datum.Type,
      incorporationDate: new Date(datum['Incorporation Date']),
      status: datum.Status,
      businessAddress: datum['Business Address'],
      registeredAddress: [{ address: datum['Registered Address'] }],
      businessSector: datum['Business Sector'],
      lastFinancialFiled:
        datum['Last Financial Filed'] !== ''
          ? new Date(datum['Last Financial Filed'])
          : null,
      natureOfBusiness: datum['Nature of Business'],
      shareCapitalTotalIssued: datum['Share Capital']['Total Issued'],
      shareCapitalCash: datum['Share Capital']['CASH'],
      shareCapitalOtherwiseThanCash:
        datum['Share Capital']['OTHERWISE THAN CASH'],
      managementDetails: datum['Management Details'].map((m) => ({
        name: m.Name,
        address: m.Address,
        localNumber: m['IC/PP/Local No'],
        designation: m.Designation,
        appointmentDate: m['Appointment Date'],
      })),
      shareholders: datum.Shareholders.map((s) => ({
        name: s.Name,
        address: s.Address,
        localNumber: s['IC/PP/Local No'],
        shareholding: s.Shareholding,
        shareholdingPercentage: s['%'],
        asAt: s['As At'],
      })),
      companyCharges: datum['Company Charges'].map((c) => ({
        chargeNumber: c['Charge Number'],
        totalOfCharge: c['Total of Charge'],
        dateOfCreation: c['Date of Creation'],
        nameOfChargee: c['Name of Chargee'],
        chargeStatus: c['Charge Status'],
      })),
      interestInOtherCompanies: datum['Interest In Other Companies'].map(
        (i) => ({
          localNo: i['Local No'],
          company: i.Company,
          shareholding: i.Shareholding,
          shareholdingPercentage: i['Shareholding Percentage'],
          remark: i.Remarks,
          asAt: i['As At'],
        }),
      ),
      nonCurrentAssets:
        typeof datum['Non Current Assets'] !== 'string'
          ? datum['Non Current Assets']
          : null,
      currentAssets:
        typeof datum['Current Assets'] !== 'string'
          ? datum['Current Assets']
          : null,
      totalAssets:
        typeof datum['Total Assets'] !== 'string'
          ? datum['Total Assets']
          : null,
      accumulatedProfitCarriedForward:
        typeof datum['Accumulated Profit Carried Forward'] !== 'string'
          ? datum['Accumulated Profit Carried Forward']
          : null,
      totalEquity:
        typeof datum['Total Equity'] !== 'string'
          ? datum['Total Equity']
          : null,
      nonCurrentLiabilities:
        typeof datum['Non Current Liabilities'] !== 'string'
          ? datum['Non Current Liabilities']
          : null,
      currentLiabilities:
        typeof datum['Current Liabilities'] !== 'string'
          ? datum['Current Liabilities']
          : null,
      totalLiabilities:
        typeof datum['Total Liabilities'] !== 'string'
          ? datum['Total Liabilities']
          : null,
      totalEquityAndLiabilities:
        typeof datum['Total Equity & Liabilities'] !== 'string'
          ? datum['Total Equity & Liabilities']
          : null,
      revenue: typeof datum.Revenue !== 'string' ? datum.Revenue : null,
      profitBeforeTax:
        typeof datum['Profit/(Loss) Before'] !== 'string'
          ? datum['Profit/(Loss) Before']
          : null,
      profitAfterTax:
        typeof datum['Profit/(Loss) After'] !== 'string'
          ? datum['Profit/(Loss) After']
          : null,
      currentRatio:
        typeof datum['Current Ratio'] !== 'string'
          ? datum['Current Ratio']
          : null,
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
      windingUpActionSubjectAsDefendant: datum[
        'WINDING-UP ACTION - SUBJECT AS DEFENDANT'
      ].map((w) => ({
        defendantName: w['Defendant Name'],
        defendantLocalNumber: w['Local No'],
        caseNumber: w['Case No'],
        courtType: w['Type/Court'],
        solicitorAddress: w['Solicitor Address'],
      })),
      windingUpActionSubjectAsPetitioner: datum[
        'WINDING-UP ACTION - SUBJECT AS PETITIONER'
      ].map((w) => ({
        petitionerName: w['Petitioner'],
        petitionerLocalNumber: w['Local No'],
        caseNumber: w['Case No'],
        courtType: w['Type/Court'],
        solicitorAddress: w['Solicitor Address'],
        defendantName: w['Defendant Name'],
        defendantLocalNumber: w['Defendant Local No'],
      })),
      iScore: numericConverter(datum['i-SCORE']),
      summaryCreditInformation: datum['Summary Credit Information'],
      detailedCreditReport: datum['Detailed Credit Report'].map((d) => ({
        facility: d.Facility,
        totalOutstandingBalance: numericConverter(
          d['Total Outstanding Balance (RM)'],
        ),
        dateBalanceUpdated: d['Date Balance Updated'],
        limitInstallmentAmount: numericConverter(d['Limit /Inst.Amt (RM)']),
        printRepaymentTerm: d['Prin Repymt Term'],
        colType: d['Col Type'],
        conductOfAccount: d['Conduct of Account for the last 12 months'],
      })),
      latestThreeApprovedFacilities:
        datum['Latest 3 Approved Facilities'] ??
        datum['Latest 3 Approved Facilites'],
      securedFacilities: datum['Secured Facilities'],
      unsecuredFacilities: datum['Unsecured Facilities'],
      creditCard: datum['Credit Card'],
      otherRevolvingCredits: datum['Other Revolving Credits'],
      chargeCard: datum['Charge Card'],
      nationalHigherEducationFinancing:
        datum['National Higher Education Financing'],
      localLenders: datum['Local Lenders'],
      foreignLenders: datum['Foreign Lenders'],
    });
    const kycReport = await kycAgencyReportRepository.upsert(
      {
        companyName: kycReportSeed.companyName,
        reportType: kycReportSeed.reportType,
        reportSource: kycReportSeed.reportSource,
      },
      kycReportSeed,
    );

    const organizationType = organizationTypeConverter(kycReport.type);
    const organizationSeed = new Organization({
      organizationName: kycReport.companyName,
      organizationType:
        organizationType === null
          ? OrganizationTypeEnum.OTHERS
          : organizationType,
      organizationTypeOther: organizationType === null ? kycReport.type : null,
      businessRegistrationNumber: kycReport.registrationNumber,
      kycBusinessSector: kycReport.businessSector,
      kycNatureOfBusiness: kycReport.natureOfBusiness,
      incorporationDate: kycReport.incorporationDate,
      businessAddress: kycReport.businessAddress,
      registeredAddress: kycReport.registeredAddress[0].address,
    });
    const organization = await organizationRepository.upsert(
      {
        organizationName: kycReport.companyName,
      },
      organizationSeed,
    );

    kycReport.organization = organization;
    await kycAgencyReportRepository.save(kycReport);

    for (const managementDetail of kycReport.managementDetails) {
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
      const buyerPersonaSeed = new BuyerPersona({
        organization: organization,
      });
      await buyerPersonaRepository.upsert(
        {
          organization: {
            id: organization.id,
          },
        },
        buyerPersonaSeed,
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
function numericConverter(
  value: string | number | null | undefined,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number') {
    return value;
  }

  let result = value.replace(/,/g, '');
  if (result.startsWith('(') && result.endsWith(')')) {
    result = '-' + result.slice(1, -1);
  }
  return parseFloat(result);
}
