import axiosClient from 'api/axiosClient';
import {
  DealRow,
  DealStage,
  LeadRow,
  LeadStatus,
  RmPerformanceRow,
  SiteVisitRow,
} from 'types/CrmTypes';

const BASE = '/customer-relationship-management/api/crm';

export const getLeads = async (scope?: 'team'): Promise<LeadRow[]> =>
  (await axiosClient().get(`${BASE}/leads`, { params: scope ? { scope } : {} })).data;

export const createLead = async (input: {
  companyName: string;
  registrationNumber?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  source?: string;
  notes?: string;
}): Promise<LeadRow> => (await axiosClient().post(`${BASE}/leads`, input)).data;

export const updateLead = async (
  id: number,
  input: Partial<{ companyName: string; contactName: string; contactEmail: string; contactPhone: string; source: string; notes: string; status: LeadStatus }>,
): Promise<LeadRow> => (await axiosClient().patch(`${BASE}/leads/${id}`, input)).data;

export const assignLead = async (id: number, rmPersonId: number): Promise<LeadRow> =>
  (await axiosClient().post(`${BASE}/leads/${id}/assign`, { rmPersonId })).data;

export const promoteLead = async (id: number): Promise<LeadRow> =>
  (await axiosClient().post(`${BASE}/leads/${id}/promote`, {})).data;

export const getDeals = async (scope?: 'team'): Promise<DealRow[]> =>
  (await axiosClient().get(`${BASE}/deals`, { params: scope ? { scope } : {} })).data;

export const createDeal = async (input: {
  leadId: number;
  title: string;
  productCode?: string;
  dealValue?: number;
  expectedCloseDate?: string;
  notes?: string;
}): Promise<DealRow> => (await axiosClient().post(`${BASE}/deals`, input)).data;

export const updateDeal = async (
  id: number,
  input: Partial<{ title: string; productCode: string; dealValue: number; expectedCloseDate: string; notes: string; stage: DealStage }>,
): Promise<DealRow> => (await axiosClient().patch(`${BASE}/deals/${id}`, input)).data;

export const getSiteVisits = async (scope?: 'team'): Promise<SiteVisitRow[]> =>
  (await axiosClient().get(`${BASE}/site-visits`, { params: scope ? { scope } : {} })).data;

export const createSiteVisit = async (input: {
  leadId?: number;
  organizationId?: number;
  visitedAt: string;
  summary: string;
  findings?: string;
}): Promise<SiteVisitRow> => (await axiosClient().post(`${BASE}/site-visits`, input)).data;

export const getPerformance = async (): Promise<RmPerformanceRow[]> =>
  (await axiosClient().get(`${BASE}/performance`)).data;
