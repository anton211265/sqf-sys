import axiosClient from 'api/axiosClient';

// Operations Hub pass 1 — trade-directory /api/operations.
export interface OperationsCaseRow {
  id: number;
  organizationId: number;
  companyName: string | null;
  applicationId: number | null;
  offerId: number | null;
  productCode: string;
  status: string;
  operatorPersonId: number | null;
  checkerPersonId: number | null;
  approverPersonId: number | null;
  agreementText: string | null;
  agreementSha256: string | null;
  agreementTerms: Record<string, any> | null;
  signedAt: string | null;
  signedCredentialId: string | null;
  contractId: number | null;
  resolutionNote: string | null;
  updatedAt: string;
}

const BASE = '/trade-directory/api/operations';

export const getOpsCases = async (): Promise<OperationsCaseRow[]> =>
  (await axiosClient().get(`${BASE}/cases`)).data;
export const getOpsCase = async (id: number): Promise<OperationsCaseRow> =>
  (await axiosClient().get(`${BASE}/cases/${id}`)).data;
export const opsCaseAction = async (
  id: number,
  action: 'pickup' | 'submit' | 'check' | 'return' | 'approve',
  note?: string,
): Promise<OperationsCaseRow> =>
  (await axiosClient().post(`${BASE}/cases/${id}/${action}`, note ? { note } : {})).data;
