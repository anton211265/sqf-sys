import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { EntityManager } from 'typeorm';
import { RiskOperationModule } from '../risk-operation.module';
import { FinancialCreditReportService } from '../sqf/financial-credit-report/financial-credit-report.service';
import { RiskQuantitativeProfileScoringService } from '../sqf/risk-quantitative-profile-scoring/risk-quantitative-profile-scoring.service';
import { RiskProfile } from '../models/risk-profile.entity';

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

  // ---- Band-classification check (Tony's ruling 2026-07-20): compute the
  // weighted total from the DEFAULT profile's stored weights and the
  // verdicts above, then classify against the profile's stored band ranges.
  // ABC with seeded weights (30/25/15/15/15, one Leverage sub failing)
  // scores 87.5 — which must classify LOW risk under the corrected bands.
  const entityManager = app.get(EntityManager);
  const defaultProfile = await entityManager.findOne(RiskProfile, {
    where: { isDefault: 1 },
  });
  if (!defaultProfile) {
    console.log('✗ No default risk profile found');
    await app.close();
    process.exit(1);
  }

  const weightRows: {
    parameterId: number;
    parameterWeight: string;
    subName: string | null;
    subWeight: string;
  }[] = await entityManager.query(
    `SELECT w.quantitative_parameter_id AS "parameterId",
            pw.weight AS "parameterWeight",
            sub.name AS "subName",
            w.weight AS "subWeight"
     FROM risk_quantitative_profile_weight w
     JOIN risk_quantitative_sub_parameter sub
       ON sub.id = w.quantitative_sub_parameter_id
     JOIN risk_quantitative_profile_weight pw
       ON pw.quantitative_parameter_id = w.quantitative_parameter_id
      AND pw.risk_profile_id = w.risk_profile_id
      AND pw.quantitative_sub_parameter_id IS NULL
     WHERE w.risk_profile_id = $1
       AND w.quantitative_sub_parameter_id IS NOT NULL`,
    [defaultProfile.id],
  );

  const passedByName = new Map<string, boolean>();
  for (const e of EXPECTATIONS) {
    const raw = scoringService.getValueFromCreditReport('', e.name, creditReport);
    const v = typeof raw === 'number' ? raw : null;
    passedByName.set(
      e.name,
      v !== null && (e.op === '>=' ? v >= e.threshold : v <= e.threshold),
    );
  }

  let totalWeightedScore = 0;
  for (const row of weightRows) {
    if (!row.subName || !passedByName.has(row.subName)) continue;
    const contribution = passedByName.get(row.subName)
      ? (Number(row.parameterWeight) * Number(row.subWeight)) / 100
      : 0;
    totalWeightedScore += contribution;
  }

  const inRange = (r: [number, number]) =>
    totalWeightedScore >= r[0] && totalWeightedScore <= r[1];
  const category = inRange(defaultProfile.lowRiskThresholds)
    ? 'LOW'
    : inRange(defaultProfile.mediumRiskThresholds)
      ? 'MEDIUM'
      : inRange(defaultProfile.highRiskThresholds)
        ? 'HIGH'
        : 'UNCLASSIFIED';

  console.log(
    `Weighted total: ${totalWeightedScore} | stored bands — low risk: [${defaultProfile.lowRiskThresholds}], medium: [${defaultProfile.mediumRiskThresholds}], high risk: [${defaultProfile.highRiskThresholds}]`,
  );
  const bandOk = category === 'LOW' && totalWeightedScore >= 71;
  console.log(
    bandOk
      ? `✓ Score ${totalWeightedScore} classifies as LOW risk — band orientation correct (high score = low risk)\n`
      : `✗ Score ${totalWeightedScore} classified as ${category} — band orientation WRONG\n`,
  );
  if (!bandOk) failures++;

  await app.close();
  process.exit(failures === 0 ? 0 : 1);
}

bootstrap();
