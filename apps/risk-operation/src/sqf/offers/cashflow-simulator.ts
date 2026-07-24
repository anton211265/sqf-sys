/**
 * Cashflow simulator (Provisional Offer workspace, 2026-07-24).
 * Pure functions — decoded from `SQF ARCHITECTURE/cashflow simulator.xlsx`
 * per docs/design/provisional-offer-design.md ruling 1. Everything is a
 * parameter (ruling 2): remittance fee, day-count base, rates — no
 * hardcoded RM40/360/12%. Rates are fractions, amounts plain numbers.
 *
 * Scenario mapping: AR -> POST_FACTORING; IF -> PRE_POST_FACTORING (pre
 * block optional); TL -> TERM_LOAN (flat | reducing, optional post-factoring
 * combo = the workbook's TF+Post sheet); SCF -> SCF (buyer-led, <=100%
 * advance less discount over buyer terms).
 */

export type ScenarioType = 'POST_FACTORING' | 'PRE_POST_FACTORING' | 'TERM_LOAN' | 'SCF';

export const PRODUCT_SCENARIOS: Record<string, ScenarioType> = {
  AR: 'POST_FACTORING',
  IF: 'PRE_POST_FACTORING',
  TL: 'TERM_LOAN',
  SCF: 'SCF',
};

export interface SimulatorInputs {
  // Post-factoring block (POST_FACTORING / PRE_POST / TL combo)
  unexpiredContractValue?: number;
  facilityLimit?: number;
  advanceRate?: number;            // fraction, e.g. 0.85
  adminFeeRate?: number;           // fraction per invoice
  tenureMonths?: number;           // number of monthly invoices
  creditPeriodDays?: number;
  profitRatePa?: number;           // fraction p.a.
  collectionPeriodMonths?: number; // default 2 per the workbook
  // Pre-factoring block (PRE_POST only)
  preFacilityLimit?: number;
  preLockInDays?: number;
  preProfitRateFlat?: number;      // fraction, flat over the lock-in
  // Term loan block
  loanAmount?: number;
  instalments?: number;
  tlRateFlatMonthly?: number;      // fraction per month
  tlConvention?: 'FLAT' | 'REDUCING_BALANCE'; // ruling 4
  tlProcessingFeeRate?: number;    // fraction of limit, deducted upfront
  includePostFactoring?: boolean;  // TL combo toggle
  // SCF block
  monthlyApprovedInvoiceVolume?: number;
  scfAdvanceRate?: number;         // fraction, <= 1.0
  scfDiscountRatePa?: number;      // fraction p.a.
  buyerTermsDays?: number;
  // Fees (from funder config / fee schedule — passed in, never hardcoded)
  processingFeeOnApplication?: number;
  remittanceFeePerInvoice?: number;
  otherFees?: number;
  dayCountBase?: number;           // 360 | 365 (funder day-count convention)
}

export interface MonthRow {
  month: number;            // 1-based index from first disbursement
  disbursement: number;     // cash out to client/supplier
  collection: number;       // cash in
  fees: number;             // fees + profit earned that month
  exposure: number;         // running net funding outstanding
}

export interface SimulationResult {
  scenario: ScenarioType;
  monthlyEconomics: Record<string, number>;
  profitProjection: { label: string; amount: number }[];
  totalProjectedProfit: number;
  highestExposure: { amount: number; monthIndex: number };
  schedule: MonthRow[];
  warnings: string[];
}

const r2 = (n: number) => Math.round(n * 100) / 100;

function need(inputs: SimulatorInputs, keys: (keyof SimulatorInputs)[]): string[] {
  return keys
    .filter((k) => inputs[k] === undefined || inputs[k] === null || Number.isNaN(Number(inputs[k])))
    .map((k) => `missing input: ${String(k)}`);
}

/** Post-factoring monthly economics (workbook sheet 1 formulas). */
function postBlock(i: SimulatorInputs) {
  const dayBase = i.dayCountBase ?? 365;
  const invoice = (i.unexpiredContractValue ?? 0) / (i.tenureMonths || 1);
  const advance = invoice * (i.advanceRate ?? 0);
  const adminFee = invoice * (i.adminFeeRate ?? 0);
  const profit = (advance - adminFee) * (i.profitRatePa ?? 0) * ((i.creditPeriodDays ?? 0) / dayBase);
  return { invoice: r2(invoice), advance: r2(advance), adminFee: r2(adminFee), profit: r2(profit) };
}

export function simulate(scenario: ScenarioType, inputs: SimulatorInputs): SimulationResult {
  const warnings: string[] = [];
  const fees = {
    processing: inputs.processingFeeOnApplication ?? 0,
    remittance: inputs.remittanceFeePerInvoice ?? 0,
    others: inputs.otherFees ?? 0,
  };

  if (scenario === 'POST_FACTORING' || scenario === 'PRE_POST_FACTORING') {
    warnings.push(...need(inputs, ['unexpiredContractValue', 'tenureMonths', 'advanceRate', 'adminFeeRate', 'creditPeriodDays', 'profitRatePa']));
    if (scenario === 'PRE_POST_FACTORING') {
      warnings.push(...need(inputs, ['preFacilityLimit', 'preLockInDays', 'preProfitRateFlat']));
    }
    if (warnings.length) return empty(scenario, warnings);

    const p = postBlock(inputs);
    const tenure = inputs.tenureMonths!;
    const collect = inputs.collectionPeriodMonths ?? 2;
    const m = Math.min(tenure, collect);

    // Pre block (IF): flat profit on the pre facility over the lock-in
    const pre = scenario === 'PRE_POST_FACTORING'
      ? (() => {
          const monthlyRate = (inputs.preProfitRateFlat! / inputs.preLockInDays!) * 30;
          const monthlyProfit = inputs.preFacilityLimit! * monthlyRate;
          const totalProfit = monthlyProfit * (inputs.preLockInDays! / 30);
          return { monthlyProfit: r2(monthlyProfit), totalProfit: r2(totalProfit) };
        })()
      : null;

    const projection = [
      { label: 'Processing fee on application', amount: r2(fees.processing) },
      { label: 'Admin fees', amount: r2(p.adminFee * tenure) },
      { label: 'Factoring profit', amount: r2(p.profit * tenure) },
      { label: 'Processing fees on remittance', amount: r2(fees.remittance * tenure) },
      ...(pre ? [{ label: 'Pre-factoring profit', amount: pre.totalProfit }] : []),
      { label: 'Other fees (LOU/LOS/advisory)', amount: r2(fees.others) },
    ];

    // Exposure: cumulative net disbursement before collections begin; the
    // pre facility adds its limit until post proceeds absorb it (workbook
    // sheet 2 branch logic, simplified to month indexes).
    const postExposure = p.advance * m - fees.processing - (p.adminFee + p.profit) * m;
    let highest = { amount: r2(postExposure), monthIndex: m };
    if (pre) {
      const postNetInCollect = p.advance * m;
      if (postNetInCollect <= inputs.preFacilityLimit!) {
        highest = { amount: r2(inputs.preFacilityLimit! - pre.totalProfit - fees.processing), monthIndex: 1 };
      } else {
        highest = { amount: r2(postNetInCollect - fees.processing - pre.totalProfit - (p.adminFee + p.profit) * m), monthIndex: m };
      }
    }

    const schedule: MonthRow[] = [];
    let exposure = pre ? inputs.preFacilityLimit! : 0;
    for (let month = 1; month <= tenure + collect; month++) {
      const disb = month <= tenure ? p.advance : 0;
      const coll = month > collect && month - collect <= tenure ? p.invoice : 0;
      const fee = month <= tenure ? p.adminFee + p.profit + fees.remittance : 0;
      exposure = Math.max(0, exposure + disb - coll - fee);
      schedule.push({ month, disbursement: r2(disb), collection: r2(coll), fees: r2(fee), exposure: r2(exposure) });
    }

    return {
      scenario,
      monthlyEconomics: {
        monthlyInvoice: p.invoice, monthlyAdvance: p.advance,
        monthlyAdminFee: p.adminFee, monthlyProfit: p.profit,
        ...(pre ? { monthlyPreProfit: pre.monthlyProfit } : {}),
      },
      profitProjection: projection,
      totalProjectedProfit: r2(projection.reduce((s, x) => s + x.amount, 0)),
      highestExposure: highest,
      schedule,
      warnings,
    };
  }

  if (scenario === 'TERM_LOAN') {
    warnings.push(...need(inputs, ['loanAmount', 'instalments', 'tlRateFlatMonthly']));
    if (warnings.length) return empty(scenario, warnings);
    const limit = inputs.loanAmount!;
    const n = inputs.instalments!;
    const rate = inputs.tlRateFlatMonthly!;
    const reducing = inputs.tlConvention === 'REDUCING_BALANCE'; // ruling 4
    const principal = limit / n;
    const processingFee = limit * (inputs.tlProcessingFeeRate ?? 0);

    const schedule: MonthRow[] = [];
    let outstanding = limit;
    let totalInterest = 0;
    const firstInterest = reducing ? outstanding * rate : limit * rate;
    // Workbook: first instalment + processing fee deducted upfront
    const netInitialDisbursement = limit - principal - firstInterest - processingFee;
    for (let month = 1; month <= n; month++) {
      const interest = reducing ? outstanding * rate : limit * rate;
      outstanding -= principal;
      totalInterest += interest;
      const disb = month === 1 ? netInitialDisbursement : 0;
      schedule.push({
        month, disbursement: r2(disb), collection: r2(principal + interest),
        fees: r2(month === 1 ? processingFee : 0), exposure: r2(Math.max(0, outstanding)),
      });
    }
    const projection = [
      { label: 'Processing fee on application', amount: r2(processingFee) },
      { label: `Term ${reducing ? 'reducing-balance' : 'flat'} profit`, amount: r2(totalInterest) },
      { label: 'Other fees (LOU/LOS/advisory)', amount: r2(fees.others) },
    ];
    return {
      scenario,
      monthlyEconomics: {
        monthlyPrincipal: r2(principal),
        firstMonthInterest: r2(firstInterest),
        totalMonthlyInstalment: r2(principal + firstInterest),
        netInitialDisbursement: r2(netInitialDisbursement),
      },
      profitProjection: projection,
      totalProjectedProfit: r2(projection.reduce((s, x) => s + x.amount, 0)),
      highestExposure: { amount: r2(netInitialDisbursement), monthIndex: 1 },
      schedule,
      warnings,
    };
  }

  // SCF — buyer-led (blueprint key characteristics): funder pays suppliers
  // up to 100% less the financing discount over the buyer's terms, buyer
  // settles 100% at maturity.
  warnings.push(...need(inputs, ['monthlyApprovedInvoiceVolume', 'scfDiscountRatePa', 'buyerTermsDays', 'tenureMonths']));
  if (warnings.length) return empty(scenario, warnings);
  const dayBase = inputs.dayCountBase ?? 365;
  const volume = inputs.monthlyApprovedInvoiceVolume!;
  const advRate = inputs.scfAdvanceRate ?? 1.0;
  const discount = volume * advRate * inputs.scfDiscountRatePa! * (inputs.buyerTermsDays! / dayBase);
  const payout = volume * advRate - discount;
  const termsMonths = Math.max(1, Math.ceil(inputs.buyerTermsDays! / 30));
  const tenure = inputs.tenureMonths!;
  const mm = Math.min(termsMonths, tenure);

  const schedule: MonthRow[] = [];
  let exposure = 0;
  for (let month = 1; month <= tenure + termsMonths; month++) {
    const disb = month <= tenure ? payout : 0;
    const coll = month > termsMonths && month - termsMonths <= tenure ? volume * advRate : 0;
    exposure = Math.max(0, exposure + disb - coll);
    schedule.push({ month, disbursement: r2(disb), collection: r2(coll), fees: r2(month <= tenure ? discount : 0), exposure: r2(exposure) });
  }
  const projection = [
    { label: 'Processing fee on application', amount: r2(fees.processing) },
    { label: 'Supplier early-payment discount', amount: r2(discount * tenure) },
    { label: 'Other fees', amount: r2(fees.others) },
  ];
  return {
    scenario: 'SCF',
    monthlyEconomics: { monthlyApprovedVolume: r2(volume), monthlySupplierPayout: r2(payout), monthlyDiscount: r2(discount) },
    profitProjection: projection,
    totalProjectedProfit: r2(projection.reduce((s, x) => s + x.amount, 0)),
    highestExposure: { amount: r2(payout * mm), monthIndex: mm },
    schedule,
    warnings,
  };
}

function empty(scenario: ScenarioType, warnings: string[]): SimulationResult {
  return {
    scenario, monthlyEconomics: {}, profitProjection: [], totalProjectedProfit: 0,
    highestExposure: { amount: 0, monthIndex: 0 }, schedule: [], warnings,
  };
}
