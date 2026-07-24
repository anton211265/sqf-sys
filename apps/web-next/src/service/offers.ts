import axiosClient from 'api/axiosClient';

// Provisional Offer workspace (CRC pass 2) — risk-operation /api/offers.

export interface SimulationResult {
  scenario: string;
  monthlyEconomics: Record<string, number>;
  profitProjection: { label: string; amount: number }[];
  totalProjectedProfit: number;
  highestExposure: { amount: number; monthIndex: number };
  schedule: { month: number; disbursement: number; collection: number; fees: number; exposure: number }[];
  warnings: string[];
}

export interface OfferRow {
  id: number;
  applicationId: number;
  companyName: string | null;
  productCode: string;
  scenario: string;
  status: string;
  inputs: Record<string, any>;
  overrides: Record<string, { default: any; value: any }> | null;
  outputs: SimulationResult | null;
  rateCardSnapshot: { rateCardId: number; version: number; params: Record<string, any> } | null;
  makerPersonId: number;
  checkerPersonId: number | null;
  approverPersonId: number | null;
  resolutionNote: string | null;
  registrationFeeConfirmedAt: string | null;
  sentAt: string | null;
  updatedAt: string;
}

const BASE = '/risk-operation/api/offers';

export const getOffers = async (): Promise<OfferRow[]> => (await axiosClient().get(BASE)).data;
export const getOffer = async (id: number): Promise<OfferRow> => (await axiosClient().get(`${BASE}/${id}`)).data;
export const createOffer = async (applicationId: number): Promise<OfferRow> =>
  (await axiosClient().post(BASE, { applicationId })).data;
export const saveOffer = async (id: number, inputs: Record<string, any>): Promise<OfferRow> =>
  (await axiosClient().put(`${BASE}/${id}`, { inputs })).data;
export const simulateOffer = async (scenario: string, inputs: Record<string, any>): Promise<SimulationResult> =>
  (await axiosClient().post(`${BASE}/simulate`, { scenario, inputs })).data;
export const offerAction = async (
  id: number,
  action: 'submit' | 'check' | 'return' | 'approve' | 'reject',
  note?: string,
): Promise<OfferRow> => (await axiosClient().post(`${BASE}/${id}/${action}`, note ? { note } : {})).data;
export const confirmOfferFee = async (id: number): Promise<{ ok: boolean }> =>
  (await axiosClient().post(`${BASE}/${id}/confirm-fee`, {})).data;

export const resolveOffer = async (
  id: number,
  action: 'accept' | 'decline' | 'refresh' | 'close',
  note?: string,
): Promise<OfferRow> => (await axiosClient().post(`${BASE}/${id}/resolve`, { action, note })).data;
