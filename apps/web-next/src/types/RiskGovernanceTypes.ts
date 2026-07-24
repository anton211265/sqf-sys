// Response shapes of /risk-operation/api/risk-governance (keep in sync with
// apps/risk-operation/src/sqf/risk-governance).

export interface RiskProfileWeight {
  weightId: number;
  parameterName: string;
  weight: number;
}

export interface RiskProfileSummary {
  id: number;
  riskProfileCode: string;
  isDefault: boolean;
  bands: {
    low: [number, number];
    medium: [number, number];
    high: [number, number];
  };
  weights: RiskProfileWeight[];
}

export interface ProposedWeightChange {
  weightId: number;
  parameterName: string;
  oldWeight: number;
  newWeight: number;
}

export interface ChangeRequestRow {
  id: number;
  riskProfileId: number;
  riskProfileCode: string;
  proposedWeights: ProposedWeightChange[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedByPersonId: number;
  requestedByOrgId: number;
  requestReason: string | null;
  decidedByPersonId: number | null;
  decidedAt: string | null;
  decisionNote: string | null;
  createdAt: string;
}
