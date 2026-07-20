import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { RiskOperationModule } from '../risk-operation.module';
import { FinancialCreditReportService } from '../sqf/financial-credit-report/financial-credit-report.service';
import { RiskQuantitativeProfileScoringService } from '../sqf/risk-quantitative-profile-scoring/risk-quantitative-profile-scoring.service';

// E2E verification that the scoring engine can now resolve every sub-parameter
// of the seeded default risk profile from financial_credit_report data, and
// that the ABC Manufacturing worked example from
// NewHorizons_DefaultRiskProfile_1 produces the manual's documented outcomes
// (9 PASS, Gearing Ratio FAIL at 0.62 vs <= 0.60).
//
// Run (after the ABC financials document has flowed through the pipeline):
//   docker compose exec risk-operation-service \
//     npx ts-node -r tsconfig-paths/register \
//     apps/risk-operation/src/scripts/verify-default-profile-scoring.ts <orgId>

// Thresholds mirror seed-default-risk-profile.ts.
const EXPECTATIONS: {
  name: string;
  op: '>=' | '<=';
  threshold: number;
  expectPass: boolean;
}[] = [
  { name: 'Current Ratio', op: '>=', threshold: 1.5, expectPass: true },
  { name: 'Quick Ratio', op: '>=', threshold: 1.0, expectPass: true },
  { name: 'Debt-to-Equity Ratio', op: '<=', threshold: 2.0, expectPass: true },
  { name: 'Gearing Ratio', op: '<=', threshold: 0.6, expectPass: false },
  { name: 'Interest Coverage Ratio', op: '>=', threshold: 1.5, expectPass: true },
  { name: 'Asset Turnover Ratio', op: '>=', threshold: 1.0, expectPass: true },
  { name: 'Debtor Days', op: '<=', threshold: 90, expectPass: true },
  { name: 'Creditor Days', op: '<=', threshold: 90, expectPass: true },
  { name: 'Revenue Growth Rate', op: '>=', threshold: 0, expectPass: true },
  { name: 'Profit Margin Trend', op: '>=', threshold: 0, expectPass: true },
];

async function bootstrap() {
  const orgId = Number(process.argv[2] ?? 2);
  const app = await NestFactory.create(RiskOperationModule);
  app.useLogger(app.get(Logger));

  const financialCreditReportService = app.get(FinancialCreditReportService);
  const scoringService = app.get(RiskQuantitativeProfileScoringService);

  const creditReport = await financialCreditReportService.findOne(orgId);

  let failures = 0;
  console.log(`\nDefault-profile scoring alignment check (org ${orgId}):\n`);
  for (const expectation of EXPECTATIONS) {
    const raw = scoringService.getValueFromCreditReport(
      '',
      expectation.name,
      creditReport,
    );
    const value = typeof raw === 'number' ? raw : null;
    if (value === null) {
      console.log(`  ✗ ${expectation.name}: NO VALUE RESOLVED`);
      failures++;
      continue;
    }
    const passed =
      expectation.op === '>='
        ? value >= expectation.threshold
        : value <= expectation.threshold;
    const asExpected = passed === expectation.expectPass;
    if (!asExpected) failures++;
    console.log(
      `  ${asExpected ? '✓' : '✗'} ${expectation.name}: ${value.toFixed(4)} ${expectation.op} ${expectation.threshold} → ${passed ? 'PASS' : 'FAIL'} (expected ${expectation.expectPass ? 'PASS' : 'FAIL'})`,
    );
  }

  console.log(
    failures === 0
      ? '\nALL 10 SUB-PARAMETERS RESOLVED WITH EXPECTED OUTCOMES\n'
      : `\n${failures} SUB-PARAMETER(S) DID NOT MATCH EXPECTATIONS\n`,
  );
  await app.close();
  process.exit(failures === 0 ? 0 : 1);
}

bootstrap();
