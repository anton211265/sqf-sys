// Client-side mirror of the Filter-2 scoring engine — PRESENTATION ONLY.
// Powers the live score in the builder's survey preview and the Run
// Assessment screen while the CO types. The server engine
// (apps/risk-operation/src/sqf/crc/scoring-engine.ts) is authoritative:
// the recorded result always comes from POST /assessments.
// Orientation: risk-points — HIGH total = HIGH risk.

import {
  AssessmentAnswers,
  FactorNode,
  LeafScoring,
  ModelShape,
  OverrideFactor,
  Thresholds,
} from 'types/CrcTypes';

export interface LiveModel {
  modelShape: ModelShape;
  factors: FactorNode[];
  overrides: OverrideFactor[];
  thresholds: Thresholds;
}

export const scoringRangeMax = (scoring: LeafScoring): number => {
  const c = scoring.config ?? {};
  switch (scoring.method) {
    case 'NUMERIC_SCORING':
      return c.max;
    case 'LABEL_SELECTION':
      return Math.max(...(c.labels ?? []).map((l: any) => l.points ?? 0), 0);
    case 'CONDITIONAL_NUMERIC':
      return Math.max(...(c.conditions ?? []).map((r: any) => r.points ?? 0), 0);
    case 'DROPDOWN_SELECTION':
      return Math.max(...(c.options ?? []).map((o: any) => o.points ?? 0), 0);
    case 'COUNTRY_SELECTION':
      return Math.max(...(c.countries ?? []).map((o: any) => o.points ?? 0), 0);
    case 'BOOLEAN':
      return Math.max(c.trueScore ?? 0, c.falseScore ?? 0);
    case 'DATE_RANGE':
      return Math.max(c.inScore ?? 0, c.outScore ?? 0);
    case 'DATE_BASED':
      return Math.max(c.matchScore ?? 0, c.elseScore ?? 0);
    default:
      return 0;
  }
};

/** Returns points, or null when the answer is missing/invalid. */
export const scoreLeaf = (scoring: LeafScoring | undefined, rawValue: any): number | null => {
  if (!scoring) return null;
  const c = scoring.config ?? {};
  if (rawValue === undefined || rawValue === null || rawValue === '') return null;
  switch (scoring.method) {
    case 'NUMERIC_SCORING': {
      const v = Number(rawValue);
      return Number.isFinite(v) && v >= c.min && v <= c.max ? v : null;
    }
    case 'LABEL_SELECTION': {
      const wanted = typeof rawValue === 'object' ? rawValue.label : rawValue;
      const label = (c.labels ?? []).find((l: any) => l.label === wanted);
      if (!label) return null;
      const subWanted = typeof rawValue === 'object' ? rawValue.subOption : undefined;
      if (subWanted) {
        const sub = (label.subOptions ?? []).find((s: any) => s.label === subWanted);
        return sub ? sub.points : null;
      }
      return label.points;
    }
    case 'CONDITIONAL_NUMERIC': {
      const v = Number(rawValue);
      if (!Number.isFinite(v)) return null;
      for (const r of c.conditions ?? []) {
        if (
          (r.operator === 'GT' && v > r.value) ||
          (r.operator === 'LT' && v < r.value) ||
          (r.operator === 'EQ' && v === r.value)
        ) {
          return r.points;
        }
      }
      return 0;
    }
    case 'DROPDOWN_SELECTION': {
      const option = (c.options ?? []).find((o: any) => o.label === rawValue);
      return option ? option.points : null;
    }
    case 'COUNTRY_SELECTION': {
      const row = (c.countries ?? []).find(
        (o: any) => o.country?.toLowerCase() === String(rawValue).toLowerCase(),
      );
      return row ? row.points : null;
    }
    case 'BOOLEAN':
      return typeof rawValue === 'boolean' ? (rawValue ? c.trueScore : c.falseScore) : null;
    case 'DATE_RANGE': {
      const t = Date.parse(rawValue);
      if (Number.isNaN(t)) return null;
      return t >= Date.parse(c.startDate) && t <= Date.parse(c.endDate) ? c.inScore : c.outScore;
    }
    case 'DATE_BASED': {
      const t = Date.parse(rawValue);
      if (Number.isNaN(t)) return null;
      const anchor = Date.parse(c.date);
      const matches =
        (c.operator === 'BEFORE' && t < anchor) ||
        (c.operator === 'AFTER' && t > anchor) ||
        (c.operator === 'ON' && t === anchor);
      return matches ? c.matchScore : c.elseScore;
    }
    default:
      return null;
  }
};

export interface LeafRef {
  nodeKey: string;
  name: string;
  scoring?: LeafScoring;
  /** effective weight fraction of the whole model (0..1) */
  weightFraction: number;
}

/** Flatten the model into its answerable leaves with effective weights. */
export const collectLeaves = (model: LiveModel): LeafRef[] => {
  const leaves: LeafRef[] = [];
  model.factors.forEach((f, fi) => {
    const fw = (f.weight ?? 0) / 100;
    if (model.modelShape === 'SIMPLE_WEIGHTED') {
      leaves.push({ nodeKey: `f${fi}`, name: f.name, scoring: f.scoring, weightFraction: fw });
      return;
    }
    (f.categories ?? []).forEach((cat, ci) => {
      const cw = (cat.weight ?? 0) / 100;
      (cat.subFactors ?? []).forEach((sub, si) => {
        leaves.push({
          nodeKey: `f${fi}.c${ci}.s${si}`,
          name: sub.name,
          scoring: sub.scoring,
          weightFraction: fw * cw * ((sub.weight ?? 0) / 100),
        });
      });
    });
  });
  return leaves;
};

export interface LiveResult {
  answered: number;
  totalLeaves: number;
  complete: boolean;
  totalScore: number;
  classification: 'LOW' | 'MEDIUM' | 'HIGH';
  overrideTripped: boolean;
}

export const computeLive = (model: LiveModel, answers: AssessmentAnswers): LiveResult => {
  const tripped = (model.overrides ?? []).some((o) => answers.overrides?.[o.name] === true);
  const leaves = collectLeaves(model);
  if (tripped) {
    return {
      answered: leaves.length,
      totalLeaves: leaves.length,
      complete: true,
      totalScore: 100,
      classification: 'HIGH',
      overrideTripped: true,
    };
  }
  let total = 0;
  let answered = 0;
  for (const leaf of leaves) {
    const points = scoreLeaf(leaf.scoring, answers.nodes?.[leaf.nodeKey]);
    if (points === null || !leaf.scoring) continue;
    answered += 1;
    const max = scoringRangeMax(leaf.scoring);
    total += (max > 0 ? points / max : 0) * leaf.weightFraction * 100;
  }
  const totalScore = Math.round(total * 100) / 100;
  const t = model.thresholds;
  const classification = totalScore <= t.low[1] ? 'LOW' : totalScore <= t.medium[1] ? 'MEDIUM' : 'HIGH';
  return {
    answered,
    totalLeaves: leaves.length,
    complete: answered === leaves.length,
    totalScore,
    classification,
    overrideTripped: false,
  };
};

export const classificationBadge = (c: 'LOW' | 'MEDIUM' | 'HIGH'): 'green' | 'amber' | 'red' =>
  c === 'LOW' ? 'green' : c === 'MEDIUM' ? 'amber' : 'red';
