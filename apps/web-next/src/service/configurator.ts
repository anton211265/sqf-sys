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
