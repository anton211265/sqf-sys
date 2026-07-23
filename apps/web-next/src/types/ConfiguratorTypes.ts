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
