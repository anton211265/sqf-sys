import axiosClient from 'api/axiosClient';
import {
  ApplicationPayload,
  ClientApplication,
  OnboardingConfig,
  RegisterInput,
  UploadedDoc,
} from 'types/PortalTypes';

export const getOnboardingConfig = async (): Promise<OnboardingConfig> =>
  (await axiosClient().get('/product-configurator/api/public/onboarding-config')).data;

export const register = async (input: RegisterInput): Promise<{ ok: boolean }> =>
  (await axiosClient().post('/trade-directory/portal/register', input)).data;

const APP_BASE = '/risk-operation/api/portal/application';

export const getApplication = async (): Promise<ClientApplication> =>
  (await axiosClient().get(APP_BASE)).data;

export const saveApplication = async (input: {
  productCode?: string;
  payload?: Partial<ApplicationPayload>;
}): Promise<ClientApplication> => (await axiosClient().put(APP_BASE, input)).data;

export const submitApplication = async (): Promise<ClientApplication> =>
  (await axiosClient().post(`${APP_BASE}/submit`, {})).data;

export const getApplicationStatus = async (): Promise<ClientApplication> =>
  (await axiosClient().get(`${APP_BASE}/status`)).data;

export const uploadDocument = async (
  file: File,
  documentClass: string,
  subjectOrganizationId: number,
  refId?: string,
): Promise<UploadedDoc> => {
  const form = new FormData();
  form.append('file', file);
  form.append('documentClass', documentClass);
  form.append('subjectOrganizationId', String(subjectOrganizationId));
  if (refId) form.append('refId', refId);
  const { data } = await axiosClient().post('/document-management/documents/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return { uuid: data.uuid ?? data.documentUuid ?? data.id, fileName: file.name };
};
