/**
 * Filter-2 scoring engine (CRC pass 1, 2026-07-24).
 *
 * Pure functions only — no Nest/TypeORM imports — so the math is trivially
 * testable and the roll-up formula can be swapped later (Tony's ruling 3:
 * Filter-2 stays flexible; v1 normalizes leaf points by the method's
 * range-max and weights bottom-up to a 0-100 total).
 *
 * ORIENTATION: risk-points — a HIGH total means HIGH risk (Low 0-20 /
 * Medium 21-50 / High 51-100 in the spec's example). This is deliberately
 * the OPPOSITE of Filter-1's bands; the two are never combined
 * arithmetically and every screen labels the band.
 */

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
  scoring: LeafScoring;
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
  /** SIMPLE_WEIGHTED: leaf scoring lives on the factor itself. */
  scoring?: LeafScoring;
  /** MULTI_FACTOR: categories inside the factor tab. */
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

export interface ModelStructure {
  modelShape: 'SIMPLE_WEIGHTED' | 'MULTI_FACTOR';
  factors: FactorNode[];
  overrides: OverrideFactor[];
  thresholds: Thresholds;
}

export interface AssessmentAnswers {
  /** nodeKey ("f0" / "f0.c1.s2") -> raw input for that leaf's method. */
  nodes: Record<string, any>;
  /** override factor name -> true means tripped. */
  overrides: Record<string, boolean>;
}

export interface AnswerRow {
  nodeKey: string;
  nodeName: string;
  rawValue: any;
  points: number;
  normalized: number;
  weightedContribution: number;
}

export interface AssessmentResult {
  totalScore: number;
  classification: 'LOW' | 'MEDIUM' | 'HIGH';
  overrideTripped: boolean;
  overrideFactors: string[];
  breakdown: {
    factors: {
      nodeKey: string;
      name: string;
      weight: number;
      score: number; // 0-1 normalized factor score
      contribution: number; // points contributed to the 0-100 total
      categories?: {
        nodeKey: string;
        name: string;
        weight: number;
        score: number;
        contribution: number;
      }[];
    }[];
  };
  answerRows: AnswerRow[];
}

const EPSILON = 0.01;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function isNum(v: any): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function weightsTotal100(nodes: { weight: number }[]): boolean {
  const total = nodes.reduce((sum, n) => sum + (isNum(n.weight) ? n.weight : NaN), 0);
  return Number.isFinite(total) && Math.abs(total - 100) <= EPSILON;
}

/** Highest awardable points for a leaf — the normalization denominator. */
export function scoringRangeMax(scoring: LeafScoring): number {
  const c = scoring.config ?? {};
  switch (scoring.method) {
    case 'NUMERIC_SCORING':
      return c.max;
    case 'LABEL_SELECTION':
      return Math.max(...(c.labels ?? []).map((l: any) => l.points));
    case 'CONDITIONAL_NUMERIC':
      return Math.max(...(c.conditions ?? []).map((r: any) => r.points));
    case 'DROPDOWN_SELECTION':
      return Math.max(...(c.options ?? []).map((o: any) => o.points));
    case 'COUNTRY_SELECTION':
      return Math.max(...(c.countries ?? []).map((o: any) => o.points));
    case 'BOOLEAN':
      return Math.max(c.trueScore, c.falseScore);
    case 'DATE_RANGE':
      return Math.max(c.inScore, c.outScore);
    case 'DATE_BASED':
      return Math.max(c.matchScore, c.elseScore);
    default:
      return NaN;
  }
}

function validateLeafScoring(path: string, scoring: LeafScoring | undefined, errors: string[]): void {
  if (!scoring || typeof scoring !== 'object' || !scoring.method) {
    errors.push(`${path}: scoring method is required`);
    return;
  }
  const c = scoring.config ?? {};
  switch (scoring.method) {
    case 'NUMERIC_SCORING':
      if (!isNum(c.min) || !isNum(c.max) || c.min >= c.max || c.min < 0) {
        errors.push(`${path}: numeric scoring needs 0 <= min < max`);
      }
      break;
    case 'LABEL_SELECTION': {
      if (!isNum(c.min) || !isNum(c.max) || c.min >= c.max || c.min < 0) {
        errors.push(`${path}: label scoring needs 0 <= min < max`);
        break;
      }
      const labels = Array.isArray(c.labels) ? c.labels : [];
      if (labels.length < 2) {
        errors.push(`${path}: label scoring needs at least 2 labels`);
        break;
      }
      for (const l of labels) {
        if (!l?.label || !isNum(l.points) || l.points < c.min || l.points > c.max) {
          errors.push(`${path}: every label needs a name and points within [${c.min}, ${c.max}]`);
          break;
        }
        for (const s of l.subOptions ?? []) {
          if (!s?.label || !isNum(s.points) || s.points < 0 || s.points > l.points) {
            errors.push(`${path}: sub-scoring options for "${l.label}" must have points within [0, ${l.points}]`);
            break;
          }
        }
      }
      // The spec's coverage rule: the label set must reach the top of the
      // score range so full points are attainable.
      if (labels.length && Math.max(...labels.map((l: any) => l.points)) !== c.max) {
        errors.push(`${path}: the highest label must award the range maximum (${c.max})`);
      }
      break;
    }
    case 'CONDITIONAL_NUMERIC': {
      const rules = Array.isArray(c.conditions) ? c.conditions : [];
      if (!rules.length) {
        errors.push(`${path}: conditional numeric scoring needs at least one condition`);
        break;
      }
      for (const r of rules) {
        if (!['GT', 'LT', 'EQ'].includes(r?.operator) || !isNum(r?.value) || !isNum(r?.points) || r.points < 0) {
          errors.push(`${path}: each condition needs operator GT/LT/EQ, a value and points >= 0`);
          break;
        }
      }
      break;
    }
    case 'DROPDOWN_SELECTION': {
      const options = Array.isArray(c.options) ? c.options : [];
      if (options.length < 2 || options.some((o: any) => !o?.label || !isNum(o.points) || o.points < 0)) {
        errors.push(`${path}: dropdown scoring needs >= 2 options, each with label and points >= 0`);
      }
      break;
    }
    case 'COUNTRY_SELECTION': {
      const countries = Array.isArray(c.countries) ? c.countries : [];
      if (!countries.length || countries.some((o: any) => !o?.country || !isNum(o.points) || o.points < 0)) {
        errors.push(`${path}: country scoring needs country rows with points >= 0 (CSV upload supported)`);
      }
      break;
    }
    case 'BOOLEAN':
      if (!isNum(c.trueScore) || !isNum(c.falseScore) || c.trueScore < 0 || c.falseScore < 0) {
        errors.push(`${path}: boolean scoring needs trueScore and falseScore >= 0`);
      }
      break;
    case 'DATE_RANGE':
      if (!c.startDate || !c.endDate || Number.isNaN(Date.parse(c.startDate)) || Number.isNaN(Date.parse(c.endDate)) || Date.parse(c.startDate) > Date.parse(c.endDate) || !isNum(c.inScore) || !isNum(c.outScore)) {
        errors.push(`${path}: date-range scoring needs a valid start <= end and in/out scores`);
      }
      break;
    case 'DATE_BASED':
      if (!['BEFORE', 'AFTER', 'ON'].includes(c.operator) || !c.date || Number.isNaN(Date.parse(c.date)) || !isNum(c.matchScore) || !isNum(c.elseScore)) {
        errors.push(`${path}: date-based scoring needs operator BEFORE/AFTER/ON, a valid date and match/else scores`);
      }
      break;
    default:
      errors.push(`${path}: unknown scoring method "${(scoring as any).method}"`);
      return;
  }
  const max = scoringRangeMax(scoring);
  if (errors.length === 0 && (!isNum(max) || max <= 0)) {
    errors.push(`${path}: scoring must make more than 0 points attainable`);
  }
}

function validateThresholds(t: Thresholds | undefined, errors: string[]): void {
  const bands: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
  if (!t || bands.some((b) => !Array.isArray(t[b]) || t[b].length !== 2 || !isNum(t[b][0]) || !isNum(t[b][1]))) {
    errors.push('thresholds: low/medium/high must each be a [start, end] pair');
    return;
  }
  for (const b of bands) {
    if (t[b][0] > t[b][1]) errors.push(`thresholds: ${b} start must be <= end`);
  }
  // Contiguous coverage of 0-100, ascending risk (risk-points orientation).
  if (t.low[0] !== 0) errors.push('thresholds: low band must start at 0');
  if (t.high[1] !== 100) errors.push('thresholds: high band must end at 100');
  if (t.medium[0] <= t.low[1] || t.medium[0] > t.low[1] + 1) {
    errors.push('thresholds: medium band must start directly after the low band');
  }
  if (t.high[0] <= t.medium[1] || t.high[0] > t.medium[1] + 1) {
    errors.push('thresholds: high band must start directly after the medium band');
  }
}

/**
 * Full structural validation — run on submit-for-check (drafts may be
 * saved incomplete; only a valid model can enter the maker-checker chain).
 */
export function validateModelStructure(structure: ModelStructure): string[] {
  const errors: string[] = [];
  if (!['SIMPLE_WEIGHTED', 'MULTI_FACTOR'].includes(structure?.modelShape)) {
    errors.push('modelShape must be SIMPLE_WEIGHTED or MULTI_FACTOR');
    return errors;
  }
  const factors = Array.isArray(structure.factors) ? structure.factors : [];
  if (!factors.length) {
    errors.push('at least one factor is required');
    return errors;
  }
  for (const f of factors) {
    if (!f?.name) errors.push('every factor needs a name');
  }
  if (!weightsTotal100(factors)) {
    errors.push('factor weights must total 100');
  }
  if (structure.modelShape === 'SIMPLE_WEIGHTED') {
    factors.forEach((f, fi) => {
      if (f.categories?.length) {
        errors.push(`f${fi} (${f.name}): simple weighted factors cannot have categories`);
      }
      validateLeafScoring(`f${fi} (${f.name})`, f.scoring, errors);
    });
  } else {
    factors.forEach((f, fi) => {
      if (f.scoring) {
        errors.push(`f${fi} (${f.name}): multi-factor tabs carry categories, not direct scoring`);
      }
      const categories = Array.isArray(f.categories) ? f.categories : [];
      if (!categories.length) {
        errors.push(`f${fi} (${f.name}): at least one category is required`);
        return;
      }
      if (!weightsTotal100(categories)) {
        errors.push(`f${fi} (${f.name}): category weights must total 100`);
      }
      categories.forEach((cat, ci) => {
        if (!cat?.name) errors.push(`f${fi}.c${ci}: every category needs a name`);
        const subs = Array.isArray(cat.subFactors) ? cat.subFactors : [];
        if (!subs.length) {
          errors.push(`f${fi}.c${ci} (${cat.name}): at least one sub-factor is required`);
          return;
        }
        if (!weightsTotal100(subs)) {
          errors.push(`f${fi}.c${ci} (${cat.name}): sub-factor weights must total 100`);
        }
        subs.forEach((sub, si) => {
          if (!sub?.name) errors.push(`f${fi}.c${ci}.s${si}: every sub-factor needs a name`);
          validateLeafScoring(`f${fi}.c${ci}.s${si} (${sub?.name ?? '?'})`, sub?.scoring, errors);
        });
      });
    });
  }
  for (const o of structure.overrides ?? []) {
    if (!o?.name) errors.push('every straight high-risk override needs a name');
  }
  validateThresholds(structure.thresholds, errors);
  return errors;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/** Raw points a leaf's method awards for the assessor's input. */
export function scoreLeaf(scoring: LeafScoring, rawValue: any): number {
  const c = scoring.config ?? {};
  switch (scoring.method) {
    case 'NUMERIC_SCORING': {
      const v = Number(rawValue);
      if (!Number.isFinite(v) || v < c.min || v > c.max) {
        throw new Error(`value must be a number within [${c.min}, ${c.max}]`);
      }
      return v;
    }
    case 'LABEL_SELECTION': {
      const wanted = typeof rawValue === 'object' && rawValue !== null ? rawValue.label : rawValue;
      const label = (c.labels ?? []).find((l: any) => l.label === wanted);
      if (!label) throw new Error(`unknown label "${wanted}"`);
      const subWanted = typeof rawValue === 'object' && rawValue !== null ? rawValue.subOption : undefined;
      if (subWanted !== undefined && subWanted !== null) {
        const sub = (label.subOptions ?? []).find((s: any) => s.label === subWanted);
        if (!sub) throw new Error(`unknown sub-option "${subWanted}" for label "${label.label}"`);
        return sub.points;
      }
      return label.points;
    }
    case 'CONDITIONAL_NUMERIC': {
      const v = Number(rawValue);
      if (!Number.isFinite(v)) throw new Error('value must be a number');
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
      if (!option) throw new Error(`unknown option "${rawValue}"`);
      return option.points;
    }
    case 'COUNTRY_SELECTION': {
      const row = (c.countries ?? []).find(
        (o: any) => o.country.toLowerCase() === String(rawValue ?? '').toLowerCase(),
      );
      if (!row) throw new Error(`country "${rawValue}" is not configured in this model`);
      return row.points;
    }
    case 'BOOLEAN': {
      if (typeof rawValue !== 'boolean') throw new Error('value must be true or false');
      return rawValue ? c.trueScore : c.falseScore;
    }
    case 'DATE_RANGE': {
      const t = Date.parse(rawValue);
      if (Number.isNaN(t)) throw new Error('value must be a valid date');
      const inRange = t >= Date.parse(c.startDate) && t <= Date.parse(c.endDate);
      return inRange ? c.inScore : c.outScore;
    }
    case 'DATE_BASED': {
      const t = Date.parse(rawValue);
      if (Number.isNaN(t)) throw new Error('value must be a valid date');
      const anchor = Date.parse(c.date);
      const matches =
        (c.operator === 'BEFORE' && t < anchor) ||
        (c.operator === 'AFTER' && t > anchor) ||
        (c.operator === 'ON' && t === anchor);
      return matches ? c.matchScore : c.elseScore;
    }
    default:
      throw new Error(`unknown scoring method "${(scoring as any).method}"`);
  }
}

function classify(total: number, t: Thresholds): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (total <= t.low[1]) return 'LOW';
  if (total <= t.medium[1]) return 'MEDIUM';
  return 'HIGH';
}

/**
 * Compute a full assessment. Throws Error with a message naming the node on
 * any missing/invalid answer — the service maps that to a 400.
 *
 * v1 roll-up (ruling 3, isolated here for later formula swaps):
 *   leaf normalized  = points / rangeMax             (0..1)
 *   category score   = sum(sub normalized * subW/100)  (0..1)
 *   factor score     = sum(category score * catW/100)  (0..1)  [multi-factor]
 *   total            = sum(factor score * factorW/100) * 100    (0..100)
 * Any tripped override short-circuits to 100 / HIGH.
 */
export function computeAssessment(
  structure: ModelStructure,
  answers: AssessmentAnswers,
): AssessmentResult {
  const tripped = (structure.overrides ?? [])
    .filter((o) => answers.overrides?.[o.name] === true)
    .map((o) => o.name);

  // A tripped straight high-risk override short-circuits the whole survey —
  // the spec pins the total to 100/HIGH regardless of any other answer, so
  // the remaining questions are not required.
  if (tripped.length > 0) {
    return {
      totalScore: 100,
      classification: 'HIGH',
      overrideTripped: true,
      overrideFactors: tripped,
      breakdown: { factors: [] },
      answerRows: [],
    };
  }

  const answerRows: AnswerRow[] = [];
  const factorBreakdown: AssessmentResult['breakdown']['factors'] = [];
  let total = 0;

  const leafRow = (
    nodeKey: string,
    node: { name: string; weight: number; scoring: LeafScoring },
    effectiveWeightFraction: number,
  ): number => {
    if (!(nodeKey in (answers.nodes ?? {}))) {
      throw new Error(`missing answer for ${nodeKey} (${node.name})`);
    }
    const rawValue = answers.nodes[nodeKey];
    let points: number;
    try {
      points = scoreLeaf(node.scoring, rawValue);
    } catch (e) {
      throw new Error(`${nodeKey} (${node.name}): ${(e as Error).message}`);
    }
    const max = scoringRangeMax(node.scoring);
    const normalized = max > 0 ? points / max : 0;
    answerRows.push({
      nodeKey,
      nodeName: node.name,
      rawValue,
      points,
      normalized,
      weightedContribution: normalized * effectiveWeightFraction * 100,
    });
    return normalized;
  };

  structure.factors.forEach((f, fi) => {
    const fw = f.weight / 100;
    if (structure.modelShape === 'SIMPLE_WEIGHTED') {
      const normalized = leafRow(
        `f${fi}`,
        { name: f.name, weight: f.weight, scoring: f.scoring as LeafScoring },
        fw,
      );
      const contribution = normalized * fw * 100;
      total += contribution;
      factorBreakdown.push({ nodeKey: `f${fi}`, name: f.name, weight: f.weight, score: normalized, contribution });
      return;
    }
    let factorScore = 0;
    const categoryBreakdown: NonNullable<AssessmentResult['breakdown']['factors'][number]['categories']> = [];
    (f.categories ?? []).forEach((cat, ci) => {
      const cw = cat.weight / 100;
      let categoryScore = 0;
      cat.subFactors.forEach((sub, si) => {
        const sw = sub.weight / 100;
        const normalized = leafRow(`f${fi}.c${ci}.s${si}`, sub, fw * cw * sw);
        categoryScore += normalized * sw;
      });
      factorScore += categoryScore * cw;
      categoryBreakdown.push({
        nodeKey: `f${fi}.c${ci}`,
        name: cat.name,
        weight: cat.weight,
        score: categoryScore,
        contribution: categoryScore * cw * fw * 100,
      });
    });
    const contribution = factorScore * fw * 100;
    total += contribution;
    factorBreakdown.push({
      nodeKey: `f${fi}`,
      name: f.name,
      weight: f.weight,
      score: factorScore,
      contribution,
      categories: categoryBreakdown,
    });
  });

  const totalScore = Math.round(total * 100) / 100;
  return {
    totalScore,
    classification: classify(totalScore, structure.thresholds),
    overrideTripped: false,
    overrideFactors: [],
    breakdown: { factors: factorBreakdown },
    answerRows,
  };
}
