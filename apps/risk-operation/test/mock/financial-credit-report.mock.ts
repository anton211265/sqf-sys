import {
  FinancialCreditReportTypeEnum,
  ProfitabilityEnum,
} from '@app/common/apps/risk-operation/enums/financial-credit-report-type.enum';
import { faker } from '@faker-js/faker';
import { FinancialCreditReport } from 'apps/risk-operation/src/models/financial-credit-report.entity';

const mockFinancialCreditReport = (
  organizationId: number,
  reportDate: Date,
): FinancialCreditReport => {
  const toFixed = (value: number, decimals = 2): string =>
    value.toFixed(decimals);

  const reportYear = reportDate.getFullYear();

  const financialCreditReport = new FinancialCreditReport({
    supportingDocumentId: undefined,
    organizationId,
    organizationName: faker.company.name(),

    reportDate,
    reportYear,
    reportType: FinancialCreditReportTypeEnum.YEAR_END,

    yearsOfOperation: faker.number.int({ min: 1, max: 25 }),
    profitability: faker.helpers.arrayElement(Object.values(ProfitabilityEnum)),

    currentRatio: toFixed(faker.number.float({ min: 0.5, max: 3.0 })),
    totalLiabilities: toFixed(
      faker.number.float({ min: 500000, max: 10000000 }),
    ),
    totalRevenue: toFixed(faker.number.float({ min: 500000, max: 10000000 })),
    netRevenue: toFixed(faker.number.float({ min: 500000, max: 10000000 })),
    netProfit: toFixed(faker.number.float({ min: 500000, max: 10000000 })),
    totalCurrentLiabilities: toFixed(
      faker.number.float({ min: 500000, max: 10000000 }),
    ),
    loanToReceivable: toFixed(faker.number.float({ min: 0.5, max: 3.0 })),
    totalLoan: toFixed(faker.number.float({ min: 500000, max: 10000000 })),
    totalCurrentAssets: toFixed(
      faker.number.float({ min: 500000, max: 10000000 }),
    ),
    totalCapital: toFixed(faker.number.float({ min: 500000, max: 10000000 })),
    netDebt: toFixed(faker.number.float({ min: 500000, max: 10000000 })),
    totalEquity: toFixed(faker.number.float({ min: 500000, max: 15000000 })),
    totalDebt: toFixed(faker.number.float({ min: 200000, max: 8000000 })),
    accountReceivables: toFixed(
      faker.number.float({ min: 100000, max: 3000000 }),
    ),
    ebitda: toFixed(faker.number.float({ min: 200000, max: 5000000 })),
    totalEquityAndLiabilities: toFixed(
      faker.number.float({ min: 1000000, max: 25000000 }),
    ),

    debtToEquity: toFixed(faker.number.float({ min: 0.1, max: 1.5 })),
    debtToEbitda: toFixed(faker.number.float({ min: 1.0, max: 5.0 })),
    debtToCapital: toFixed(faker.number.float({ min: 0.1, max: 0.6 })),

    interestExpense: toFixed(faker.number.float({ min: 10000, max: 500000 })),
    depreciationAndAmortization: toFixed(
      faker.number.float({ min: 10000, max: 300000 }),
    ),
    retainedCashFlow: toFixed(
      faker.number.float({ min: 200000, max: 5000000 }),
    ),
    rcfToNetDebt: toFixed(faker.number.float({ min: 0.1, max: 1.0 })),
    ebitdaToInterestExpense: toFixed(
      faker.number.float({ min: 1.0, max: 5.0 }),
    ),
    principalRepayment: toFixed(
      faker.number.float({ min: 20000, max: 1000000 }),
    ),
    debtServiceCoverageRatio: toFixed(
      faker.number.float({ min: 1.0, max: 5.0 }),
    ),
  });

  return financialCreditReport;
};

export { mockFinancialCreditReport };
