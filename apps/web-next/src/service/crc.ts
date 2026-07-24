import axiosClient from 'api/axiosClient';
import {
  AssessmentAnswers,
  AssessmentDetail,
  AssessmentRow,
  ConductAssessmentResult,
  RiskModelDetail,
  RiskModelRow,
  SaveModelInput,
} from 'types/CrcTypes';

const BASE = '/risk-operation/api/crc';

export const getRiskModels = async (status?: string): Promise<RiskModelRow[]> =>
  (await axiosClient().get(`${BASE}/risk-models`, { params: status ? { status } : {} })).data;

export const getRiskModel = async (id: number): Promise<RiskModelDetail> =>
  (await axiosClient().get(`${BASE}/risk-models/${id}`)).data;

export const createRiskModel = async (
  input: SaveModelInput & { riskModelName: string; duplicateFromId?: number },
): Promise<{ id: number; riskModelNumber: string }> =>
  (await axiosClient().post(`${BASE}/risk-models`, input)).data;

export const updateRiskModel = async (id: number, input: SaveModelInput): Promise<void> =>
  (await axiosClient().put(`${BASE}/risk-models/${id}`, input)).data;

export const submitRiskModel = async (id: number) =>
  (await axiosClient().post(`${BASE}/risk-models/${id}/submit`, {})).data;

export const checkRiskModel = async (id: number) =>
  (await axiosClient().post(`${BASE}/risk-models/${id}/check`, {})).data;

export const returnRiskModel = async (id: number, note?: string) =>
  (await axiosClient().post(`${BASE}/risk-models/${id}/return`, { note })).data;

export const rejectRiskModel = async (id: number, note?: string) =>
  (await axiosClient().post(`${BASE}/risk-models/${id}/reject`, { note })).data;

export const publishRiskModel = async (id: number) =>
  (await axiosClient().post(`${BASE}/risk-models/${id}/publish`, {})).data;

export const archiveRiskModel = async (id: number) =>
  (await axiosClient().post(`${BASE}/risk-models/${id}/archive`, {})).data;

export const getAssessments = async (organizationId?: number): Promise<AssessmentRow[]> =>
  (
    await axiosClient().get(`${BASE}/assessments`, {
      params: organizationId ? { organizationId } : {},
    })
  ).data;

export const getAssessment = async (id: number): Promise<AssessmentDetail> =>
  (await axiosClient().get(`${BASE}/assessments/${id}`)).data;

export const conductAssessment = async (input: {
  riskModelId: number;
  organizationId: number;
  organizationName?: string;
  answers: AssessmentAnswers;
}): Promise<ConductAssessmentResult> =>
  (await axiosClient().post(`${BASE}/assessments`, input)).data;
