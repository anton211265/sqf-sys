// Response shapes of /product-configurator/api (keep in sync with
// apps/product-configurator/src — numeric columns arrive as strings,
// rates are fractions: "0.0850" = 8.5%).

export type RateCardStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type FormulaType = 'COMPOUND_DAILY' | 'SIMPLE_INTEREST' | 'TIERED_DISCOUNT';

export interface ConfigProduct {
  id: number;
  productCode: string;
  productName: string;
  description: string | null;
  isCustomBespoke: boolean;
  clientOwnerOrganizationId: number | null;
  funderOrganizationId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RateCard {
  id: number;
  productId: number;
  versionNumber: number;
  status: RateCardStatus;
  minTenureDays: number;
  maxTenureDays: number;
  interestRateApr: string | null;
  advanceRatePct: string | null;
  discountFeePct: string | null;
  oneTimeAdminFee: string;
  reserveRetainPct: string;
  formulaType: FormulaType | null;
  customVariables: { key: string; value: string }[] | null;
  configuredByAgent: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export interface RateCardInput {
  interestRateApr?: number;
  advanceRatePct?: number;
  discountFeePct?: number;
  oneTimeAdminFee?: number;
  reserveRetainPct?: number;
  minTenureDays?: number;
  maxTenureDays?: number;
  formulaType?: FormulaType;
  customVariables?: { key: string; value: string }[];
  changeReason?: string;
}

export interface LegalTemplate {
  id: number;
  documentCode: string;
  documentName: string;
  templateFileUrl: string | null;
  templateBody: string | null;
  isRequiredDefault: boolean;
  funderOrganizationId: number;
  createdAt: string;
}

export interface Assignment {
  id: number;
  organizationId: number;
  productId: number;
  product?: ConfigProduct;
  funderOrganizationId: number;
  sourceRateCardId: number | null;
  sourceVersionNumber: number | null;
  assignedInterestRate: string;
  assignedAdvanceRate: string | null;
  assignedDiscountFee: string | null;
  assignedAdminFee: string;
  assignedReservePct: string | null;
  tenureDaysLimit: number;
  status: 'ACTIVE' | 'TERMINATED';
  assignedAt: string;
}

export interface ConfigAuditRow {
  id: number;
  targetTable: string;
  entityId: string;
  productId: number | null;
  actorType: 'HUMAN_PM' | 'AI_AGENT';
  actorIdentifier: string;
  actionPerformed: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown>;
  changeReason: string | null;
  funderOrganizationId: number;
  createdAt: string;
}

/** "8.5" (percent, UI) ⇄ 0.085 (fraction, API) helpers. */
export const percentToFraction = (percent: number): number =>
  Number((percent / 100).toFixed(4));
export const fractionToPercent = (fraction: string | null): string =>
  fraction === null ? '—' : `${(parseFloat(fraction) * 100).toFixed(2)}%`;

// ---- Billing & Fee Execution Engine ----

export interface BaseRateIndexRow {
  id: number;
  funderOrganizationId: number;
  indexCode: string;
  ratePct: string; // fraction
  updateMode: 'MANUAL' | 'API';
  updatedAt: string;
}

export interface FeeScheduleRow {
  id: number;
  funderOrganizationId: number;
  feeCode: string;
  feeName: string;
  amount: string;
  chargeBasis: 'TRANSACTION' | 'AUDIT' | 'CHECK' | 'MONTH';
  deductionRule: 'AT_DISBURSEMENT' | 'MONTHLY_INVOICE';
  isActive: boolean;
}

export interface BillingOverview {
  indices: BaseRateIndexRow[];
  fees: FeeScheduleRow[];
  settings: { dayCountConvention: string; penaltyMarginPct: string } | null;
}

// ---- Global Clearing Calendar ----

export interface CalendarDayRow {
  id: number;
  funderOrganizationId: number;
  region: string;
  dayDate: string;
  dayType: 'HOLIDAY' | 'HALF_DAY' | 'SHUTDOWN';
  description: string | null;
  cutoffTime: string | null;
}

export interface CalendarOverview {
  days: CalendarDayRow[];
  settings: { rolloverRule: 'MODIFIED_FOLLOWING' | 'PRECEDING' } | null;
}

// ---- Governance Policies ----

export interface SlaRow {
  id: number;
  slaCode: string;
  slaName: string;
  windowValue: number;
  windowUnit: 'HOURS' | 'DAYS' | 'WORKING_DAYS';
  breachAction: string;
  isActive: boolean;
  funderOrganizationId: number;
}

export interface ApprovalRuleRow {
  id: number;
  scope: string;
  thresholdAmount: string | null;
  requiredApprovals: number;
  mode: 'SEQUENTIAL' | 'PARALLEL';
  description: string | null;
  funderOrganizationId: number;
}

export interface CreditRangeRow {
  id: number;
  productCode: string;
  riskBand: 'LOW' | 'MEDIUM' | 'HIGH';
  minLimit: string;
  maxLimit: string;
  funderOrganizationId: number;
}

export interface PoliciesOverview {
  slas: SlaRow[];
  approvalRules: ApprovalRuleRow[];
  creditRanges: CreditRangeRow[];
  settings: {
    bankCountryMatchMode: 'HARD_BLOCK' | 'FLAG_ONLY';
    corporateEmailMode: 'BLOCK' | 'FLAG_ONLY';
  } | null;
}

// ---- SLA firing engine ----

export interface SlaTimerRow {
  id: number;
  funderOrganizationId: number;
  slaCode: string;
  subjectType: string;
  subjectId: string;
  region: string | null;
  startedAt: string;
  deadlineAt: string;
  status: 'RUNNING' | 'RESOLVED' | 'BREACHED';
  breachedAt: string | null;
  resolvedAt: string | null;
  resolveReason: string | null;
  notifyEmail: string | null;
  context: Record<string, unknown> | null;
}
