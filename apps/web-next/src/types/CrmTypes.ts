// Response shapes of /customer-relationship-management/api/crm.

export type LeadStatus = 'LEAD' | 'PROSPECT' | 'PROMOTED' | 'CLOSED';
export type DealStage = 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';

export const DEAL_STAGES: DealStage[] = ['QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

export interface LeadRow {
  id: number;
  funderOrganizationId: number;
  companyName: string;
  registrationNumber: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  source: string | null;
  status: LeadStatus;
  ownerRmPersonId: number;
  organizationId: number | null;
  notes: string | null;
  qualifiedAt: string | null;
  promotedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DealRow {
  id: number;
  leadId: number;
  lead?: LeadRow;
  ownerRmPersonId: number;
  title: string;
  productCode: string | null;
  dealValue: string | null;
  expectedCloseDate: string | null;
  stage: DealStage;
  notes: string | null;
  closedAt: string | null;
  updatedAt: string;
}

export interface SiteVisitRow {
  id: number;
  leadId: number | null;
  organizationId: number | null;
  visitedAt: string;
  summary: string;
  findings: string | null;
  reportedByPersonId: number;
}

export interface RmPerformanceRow {
  rmPersonId: number;
  leads: number;
  prospects: number;
  promoted: number;
  dealsOpen: number;
  dealsWon: number;
  dealsLost: number;
  pipelineValue: number;
  qualificationRate: number;
  winRate: number;
}
