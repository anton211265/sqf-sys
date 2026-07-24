import axiosClient from 'api/axiosClient';
import { ChangeRequestRow, RiskProfileSummary } from 'types/RiskGovernanceTypes';

const BASE = '/risk-operation/api/risk-governance';

export const getRiskProfiles = async (): Promise<RiskProfileSummary[]> =>
  (await axiosClient().get(`${BASE}/profiles`)).data;

export const getChangeRequests = async (
  status?: string,
): Promise<ChangeRequestRow[]> =>
  (
    await axiosClient().get(`${BASE}/change-requests`, {
      params: status ? { status } : {},
    })
  ).data;

export const createChangeRequest = async (input: {
  riskProfileCode: string;
  weights: { weightId: number; newWeight: number }[];
  reason?: string;
}): Promise<ChangeRequestRow> =>
  (await axiosClient().post(`${BASE}/change-requests`, input)).data;

export const approveChangeRequest = async (id: number): Promise<ChangeRequestRow> =>
  (await axiosClient().post(`${BASE}/change-requests/${id}/approve`, {})).data;

export const rejectChangeRequest = async (
  id: number,
  note?: string,
): Promise<ChangeRequestRow> =>
  (await axiosClient().post(`${BASE}/change-requests/${id}/reject`, { note })).data;
