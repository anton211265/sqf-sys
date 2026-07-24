import axiosClient from 'api/axiosClient';

// Customer Portal pass 1 — web-intake surfaces.
// risk-operation owns the application lifecycle (/api/intake);
// CRM owns the supervisor queue projection + RM assignment.

export interface IntakeApplicationRow {
  id: number;
  applicationNumber: string;
  status: string;
  companyName: string;
  organizationId: number;
  funderOrganizationId: number;
  productCode: string | null;
  filter1Score: number | null;
  filter1Category: string | null;
  complianceFlags: Record<string, any> | null;
  submittedAt: string | null;
  scoredAt: string | null;
  overriddenByPersonId: number | null;
  updatedAt: string;
}

export interface ApplicantIntakeRow {
  id: number;
  applicationId: number;
  applicationNumber: string;
  organizationId: number;
  companyName: string | null;
  productCode: string | null;
  filter1Score: number | null;
  filter1Category: string | null;
  result: 'PASS' | 'FAIL';
  overridden: boolean;
  assignedRmPersonId: number | null;
  submittedAt: string | null;
}

const RO_BASE = '/risk-operation/api/intake';
const CRM_BASE = '/customer-relationship-management/api/crm';

export const getIntakeApplications = async (bucket?: 'crc'): Promise<IntakeApplicationRow[]> =>
  (await axiosClient().get(`${RO_BASE}/applications`, { params: bucket ? { bucket } : {} })).data;

export const getIntakeApplication = async (id: number): Promise<IntakeApplicationRow & { applicationPayload: Record<string, any> }> =>
  (await axiosClient().get(`${RO_BASE}/applications/${id}`)).data;

export const overrideIntakePass = async (id: number) =>
  (await axiosClient().post(`${RO_BASE}/applications/${id}/override-pass`, {})).data;

export const getWebApplicants = async (): Promise<ApplicantIntakeRow[]> =>
  (await axiosClient().get(`${CRM_BASE}/applicants-web`)).data;

export const assignWebApplicant = async (id: number, rmPersonId: number) =>
  (await axiosClient().post(`${CRM_BASE}/applicants-web/${id}/assign`, { rmPersonId })).data;
