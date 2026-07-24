import axiosClient from 'api/axiosClient';
import {
  Assignment,
  ConfigAuditRow,
  ConfigProduct,
  LegalTemplate,
  RateCard,
  RateCardInput,
} from 'types/ConfiguratorTypes';

const BASE = '/product-configurator/api';

export const getProducts = async (): Promise<ConfigProduct[]> =>
  (await axiosClient().get(`${BASE}/products`)).data;

export const createProduct = async (input: {
  productCode: string;
  productName: string;
  description?: string;
}): Promise<ConfigProduct> =>
  (await axiosClient().post(`${BASE}/products`, input)).data;

export const updateProduct = async (
  id: number,
  input: { productName?: string; description?: string; isActive?: boolean; changeReason?: string },
): Promise<ConfigProduct> =>
  (await axiosClient().patch(`${BASE}/products/${id}`, input)).data;

export const createBespokeProduct = async (
  input: RateCardInput & {
    clientOwnerOrganizationId: number;
    productName: string;
    description?: string;
  },
): Promise<{ product: ConfigProduct; rateCard: RateCard }> =>
  (await axiosClient().post(`${BASE}/products/bespoke`, input)).data;

export const getRateCards = async (productId: number): Promise<RateCard[]> =>
  (await axiosClient().get(`${BASE}/products/${productId}/rate-cards`)).data;

export const createRateCardDraft = async (
  productId: number,
  input: RateCardInput,
): Promise<RateCard> =>
  (await axiosClient().post(`${BASE}/products/${productId}/rate-cards`, input)).data;

export const updateRateCardDraft = async (
  id: number,
  input: RateCardInput,
): Promise<RateCard> =>
  (await axiosClient().patch(`${BASE}/rate-cards/${id}`, input)).data;

export const publishRateCard = async (id: number): Promise<RateCard> =>
  (await axiosClient().post(`${BASE}/rate-cards/${id}/publish`, {})).data;

export const getTemplates = async (): Promise<LegalTemplate[]> =>
  (await axiosClient().get(`${BASE}/legal-templates`)).data;

export const createTemplate = async (input: {
  documentCode: string;
  documentName: string;
  templateBody?: string;
  templateFileUrl?: string;
  isRequiredDefault?: boolean;
}): Promise<LegalTemplate> =>
  (await axiosClient().post(`${BASE}/legal-templates`, input)).data;

export const getProductTemplates = async (
  productId: number,
): Promise<LegalTemplate[]> =>
  (await axiosClient().get(`${BASE}/products/${productId}/legal-templates`)).data;

export const bindProductTemplates = async (
  productId: number,
  templateIds: number[],
): Promise<LegalTemplate[]> =>
  (
    await axiosClient().put(`${BASE}/products/${productId}/legal-templates`, {
      templateIds,
    })
  ).data;

export const getAssignments = async (
  organizationId?: number,
): Promise<Assignment[]> =>
  (
    await axiosClient().get(`${BASE}/assignments`, {
      params: organizationId ? { organizationId } : {},
    })
  ).data;

export const createAssignment = async (input: {
  organizationId: number;
  productId: number;
  changeReason?: string;
}): Promise<Assignment> =>
  (await axiosClient().post(`${BASE}/assignments`, input)).data;

export const renderAssignment = async (
  assignmentId: number,
  templateId: number,
): Promise<{ rendered: string }> =>
  (await axiosClient().get(`${BASE}/assignments/${assignmentId}/render/${templateId}`))
    .data;

export const getConfigAudit = async (
  limit = 100,
): Promise<{ total: number; rows: ConfigAuditRow[] }> =>
  (await axiosClient().get(`${BASE}/audit`, { params: { limit } })).data;

// ---- Billing & Fee Execution Engine ----

export const getBilling = async (): Promise<import('types/ConfiguratorTypes').BillingOverview> =>
  (await axiosClient().get(`${BASE}/billing`)).data;

export const upsertRateIndex = async (input: {
  indexCode: string;
  ratePct: number;
  updateMode?: 'MANUAL' | 'API';
}) => (await axiosClient().put(`${BASE}/billing/indices`, input)).data;

export const deleteRateIndex = async (id: number) =>
  (await axiosClient().delete(`${BASE}/billing/indices/${id}`)).data;

export const upsertFee = async (input: {
  feeCode: string;
  feeName: string;
  amount: number;
  chargeBasis?: string;
  deductionRule?: string;
  isActive?: boolean;
}) => (await axiosClient().put(`${BASE}/billing/fees`, input)).data;

export const deleteFee = async (id: number) =>
  (await axiosClient().delete(`${BASE}/billing/fees/${id}`)).data;

export const patchBillingSettings = async (input: {
  dayCountConvention?: string;
  penaltyMarginPct?: number;
}) => (await axiosClient().patch(`${BASE}/billing/settings`, input)).data;

// ---- Global Clearing Calendar ----

export const getCalendar = async (): Promise<import('types/ConfiguratorTypes').CalendarOverview> =>
  (await axiosClient().get(`${BASE}/calendar`)).data;

export const upsertCalendarDay = async (input: {
  region: string;
  dayDate: string;
  dayType?: string;
  description?: string;
  cutoffTime?: string;
}) => (await axiosClient().post(`${BASE}/calendar/days`, input)).data;

export const deleteCalendarDay = async (id: number) =>
  (await axiosClient().delete(`${BASE}/calendar/days/${id}`)).data;

export const patchCalendarSettings = async (input: { rolloverRule: string }) =>
  (await axiosClient().patch(`${BASE}/calendar/settings`, input)).data;

// ---- Governance Policies ----

export const getPolicies = async (): Promise<import('types/ConfiguratorTypes').PoliciesOverview> =>
  (await axiosClient().get(`${BASE}/policies`)).data;

export const upsertSla = async (input: {
  slaCode: string;
  slaName: string;
  windowValue: number;
  windowUnit?: string;
  breachAction: string;
  isActive?: boolean;
}) => (await axiosClient().put(`${BASE}/policies/slas`, input)).data;

export const deleteSla = async (id: number) =>
  (await axiosClient().delete(`${BASE}/policies/slas/${id}`)).data;

export const upsertApprovalRule = async (input: {
  id?: number;
  scope: string;
  thresholdAmount?: number;
  requiredApprovals: number;
  mode?: string;
  description?: string;
}) => (await axiosClient().put(`${BASE}/policies/approval-rules`, input)).data;

export const deleteApprovalRule = async (id: number) =>
  (await axiosClient().delete(`${BASE}/policies/approval-rules/${id}`)).data;

export const upsertCreditRange = async (input: {
  productCode: string;
  riskBand: string;
  minLimit: number;
  maxLimit: number;
}) => (await axiosClient().put(`${BASE}/policies/credit-ranges`, input)).data;

export const deleteCreditRange = async (id: number) =>
  (await axiosClient().delete(`${BASE}/policies/credit-ranges/${id}`)).data;

export const patchPolicySettings = async (input: {
  bankCountryMatchMode?: string;
  corporateEmailMode?: string;
}) => (await axiosClient().patch(`${BASE}/policies/settings`, input)).data;

// ---- SLA firing engine ----

export const getSlaTimers = async (
  status?: string,
): Promise<import('types/ConfiguratorTypes').SlaTimerRow[]> =>
  (
    await axiosClient().get(`${BASE}/sla/timers`, {
      params: status ? { status } : {},
    })
  ).data;

export const resolveSlaTimer = async (id: number, reason?: string) =>
  (await axiosClient().post(`${BASE}/sla/timers/${id}/resolve`, { reason })).data;

// ---- Filter-2 risk profile assignment ----

export const getProductRiskFilter = async (
  productId: number,
): Promise<{ riskProfileCode: string | null }> =>
  (await axiosClient().get(`${BASE}/products/${productId}/risk-filter`)).data;

export const assignProductRiskFilter = async (
  productId: number,
  riskProfileCode: string | null,
): Promise<{ riskProfileCode: string | null }> =>
  (
    await axiosClient().put(`${BASE}/products/${productId}/risk-filter`, {
      riskProfileCode,
    })
  ).data;
