// CRC pass 1 — Filter-2 risk models + assessments (risk-operation /api/crc).
// ORIENTATION: these scores are risk-points (HIGH total = HIGH risk) — the
// opposite of Filter-1's bands. Screens must always label the band.

export type ScoreMethod =
  | 'NUMERIC_SCORING'
  | 'LABEL_SELECTION'
  | 'CONDITIONAL_NUMERIC'
  | 'DROPDOWN_SELECTION'
  | 'COUNTRY_SELECTION'
  | 'BOOLEAN'
  | 'DATE_RANGE'
  | 'DATE_BASED';

export interface LeafScoring {
  method: ScoreMethod;
  config: Record<string, any>;
}

export interface SubFactorNode {
  name: string;
  description?: string;
  weight: number;
  scoring?: LeafScoring;
}

export interface CategoryNode {
  name: string;
  description?: string;
  weight: number;
  subFactors: SubFactorNode[];
}

export interface FactorNode {
  name: string;
  description?: string;
  weight: number;
  scoring?: LeafScoring;
  categories?: CategoryNode[];
}

export interface OverrideFactor {
  name: string;
  description?: string;
}

export interface Thresholds {
  low: [number, number];
  medium: [number, number];
  high: [number, number];
}

export type ModelShape = 'SIMPLE_WEIGHTED' | 'MULTI_FACTOR';
export type ModelStatus = 'DRAFT' | 'PENDING_CHECK' | 'CHECKED' | 'PUBLISHED' | 'ARCHIVED';

export interface RiskModelRow {
  id: number;
  riskModelNumber: string;
  riskModelName: string;
  description: string | null;
  modelShape: ModelShape;
  status: ModelStatus;
  funderOrganizationId: number;
  createdByPersonId: number | null;
  checkedByPersonId: number | null;
  publishedByPersonId: number | null;
  submittedAt: string | null;
  checkedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  thresholds: Thresholds;
}

export interface RiskModelDetail extends RiskModelRow {
  modelShape: ModelShape;
  factors: FactorNode[];
  overrides: OverrideFactor[];
}

export interface SaveModelInput {
  riskModelName?: string;
  description?: string;
  modelShape?: ModelShape;
  thresholds?: Thresholds;
  factors?: FactorNode[];
  overrides?: OverrideFactor[];
}

export interface AssessmentAnswers {
  nodes: Record<string, any>;
  overrides: Record<string, boolean>;
}

export interface AssessmentRow {
  id: number;
  organizationId: number;
  organizationName: string | null;
  riskModelId: number;
  riskModelNumber: string;
  riskModelName: string;
  totalScore: number;
  classification: 'LOW' | 'MEDIUM' | 'HIGH';
  overrideTripped: boolean;
  conductedByPersonId: number;
  createdAt: string;
}

export interface AssessmentDetail extends AssessmentRow {
  modelSnapshot: {
    modelShape: ModelShape;
    factors: FactorNode[];
    overrides: OverrideFactor[];
    thresholds: Thresholds;
  };
  overrideFactors: string[] | null;
  breakdown: {
    factors: {
      nodeKey: string;
      name: string;
      weight: number;
      score: number;
      contribution: number;
      categories?: { nodeKey: string; name: string; weight: number; score: number; contribution: number }[];
    }[];
  };
  answers: {
    nodeKey: string;
    nodeName: string;
    rawValue: any;
    points: number | null;
    normalized: number | null;
    weightedContribution: number | null;
  }[];
}

export interface ConductAssessmentResult {
  id: number;
  totalScore: number;
  classification: 'LOW' | 'MEDIUM' | 'HIGH';
  overrideTripped: boolean;
  overrideFactors: string[];
}
