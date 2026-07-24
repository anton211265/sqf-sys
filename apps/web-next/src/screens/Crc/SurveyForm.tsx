import * as React from 'react';

import { Badge } from 'components/ui/badge';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { classificationBadge, computeLive, LiveModel } from 'lib/crcScoring';
import { AssessmentAnswers, LeafScoring, SubFactorNode } from 'types/CrcTypes';

/**
 * Renders a Filter-2 model as its assessment survey: factor tabs,
 * category sections, one input per leaf's scoring method, the straight
 * high-risk override checklist, a progress bar and the LIVE score
 * (client-side mirror — the server result is authoritative on submit).
 */

const selectCls =
  'h-9 w-full rounded-md border border-input bg-background px-3 text-sm';

function LeafInput({
  nodeKey,
  scoring,
  value,
  onChange,
}: {
  nodeKey: string;
  scoring?: LeafScoring;
  value: any;
  onChange: (v: any) => void;
}) {
  if (!scoring) return <p className="text-xs text-destructive">No scoring method configured.</p>;
  const c = scoring.config ?? {};
  switch (scoring.method) {
    case 'NUMERIC_SCORING':
    case 'CONDITIONAL_NUMERIC':
      return (
        <Input
          id={nodeKey}
          type="number"
          value={value ?? ''}
          placeholder={
            scoring.method === 'NUMERIC_SCORING' ? `Score ${c.min}–${c.max}` : 'Enter value'
          }
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        />
      );
    case 'LABEL_SELECTION': {
      const selected = (c.labels ?? []).find(
        (l: any) => l.label === (typeof value === 'object' ? value?.label : value),
      );
      return (
        <div className="space-y-2">
          <select
            id={nodeKey}
            className={selectCls}
            value={typeof value === 'object' ? value?.label ?? '' : value ?? ''}
            onChange={(e) => onChange(e.target.value ? { label: e.target.value } : undefined)}
          >
            <option value="">Select…</option>
            {(c.labels ?? []).map((l: any) => (
              <option key={l.label} value={l.label}>
                {l.label} ({l.points} pts)
              </option>
            ))}
          </select>
          {selected?.subOptions?.length > 0 && (
            <select
              className={selectCls}
              value={typeof value === 'object' ? value?.subOption ?? '' : ''}
              onChange={(e) =>
                onChange({ label: selected.label, subOption: e.target.value || undefined })
              }
            >
              <option value="">Refine ({selected.label})…</option>
              {selected.subOptions.map((s: any) => (
                <option key={s.label} value={s.label}>
                  {s.label} ({s.points} pts)
                </option>
              ))}
            </select>
          )}
        </div>
      );
    }
    case 'DROPDOWN_SELECTION':
      return (
        <select id={nodeKey} className={selectCls} value={value ?? ''} onChange={(e) => onChange(e.target.value || undefined)}>
          <option value="">Select…</option>
          {(c.options ?? []).map((o: any) => (
            <option key={o.label} value={o.label}>
              {o.label} ({o.points} pts)
            </option>
          ))}
        </select>
      );
    case 'COUNTRY_SELECTION':
      return (
        <select id={nodeKey} className={selectCls} value={value ?? ''} onChange={(e) => onChange(e.target.value || undefined)}>
          <option value="">Select country…</option>
          {(c.countries ?? []).map((o: any) => (
            <option key={o.country} value={o.country}>
              {o.country} ({o.points} pts)
            </option>
          ))}
        </select>
      );
    case 'BOOLEAN':
      return (
        <select
          id={nodeKey}
          className={selectCls}
          value={value === true ? 'yes' : value === false ? 'no' : ''}
          onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.value === 'yes')}
        >
          <option value="">Select…</option>
          <option value="yes">Yes ({c.trueScore} pts)</option>
          <option value="no">No ({c.falseScore} pts)</option>
        </select>
      );
    case 'DATE_RANGE':
    case 'DATE_BASED':
      return (
        <Input
          id={nodeKey}
          type="date"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || undefined)}
        />
      );
    default:
      return <p className="text-xs text-destructive">Unsupported method.</p>;
  }
}

function LeafRow({
  nodeKey,
  node,
  answers,
  onAnswer,
}: {
  nodeKey: string;
  node: SubFactorNode;
  answers: AssessmentAnswers;
  onAnswer: (nodeKey: string, v: any) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 rounded-md border bg-background p-3 md:grid-cols-2 md:items-center md:gap-4">
      <div>
        <Label htmlFor={nodeKey} className="font-medium">
          {node.name} <span className="text-xs text-muted-foreground">({node.weight}%)</span>
        </Label>
        {node.description && <p className="text-xs text-muted-foreground">{node.description}</p>}
      </div>
      <LeafInput
        nodeKey={nodeKey}
        scoring={node.scoring}
        value={answers.nodes[nodeKey]}
        onChange={(v) => onAnswer(nodeKey, v)}
      />
    </div>
  );
}

const SurveyForm: React.FC<{
  model: LiveModel;
  answers: AssessmentAnswers;
  onChange: (answers: AssessmentAnswers) => void;
}> = ({ model, answers, onChange }) => {
  const [activeFactor, setActiveFactor] = React.useState(0);
  const live = computeLive(model, answers);

  const setNode = (nodeKey: string, v: any) =>
    onChange({ ...answers, nodes: { ...answers.nodes, [nodeKey]: v } });
  const setOverride = (name: string, v: boolean) =>
    onChange({ ...answers, overrides: { ...answers.overrides, [name]: v } });

  const factor = model.factors[Math.min(activeFactor, model.factors.length - 1)];
  const fi = Math.min(activeFactor, model.factors.length - 1);

  return (
    <div className="space-y-4">
      {/* Live result strip */}
      <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/40 p-3">
        <div className="min-w-32 flex-1">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>
              {live.answered}/{live.totalLeaves} answered
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${live.totalLeaves ? (live.answered / live.totalLeaves) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="text-sm">
          Live score: <span className="font-semibold">{live.totalScore}</span> / 100
        </div>
        <Badge variant={classificationBadge(live.classification)}>
          {live.classification} RISK{live.overrideTripped ? ' (OVERRIDE)' : ''}
        </Badge>
        <span className="text-xs text-muted-foreground">high score = high risk</span>
      </div>

      {/* Straight high-risk overrides */}
      {model.overrides.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50/50 p-3 dark:border-red-900 dark:bg-red-950/20">
          <p className="mb-2 text-sm font-medium">Straight high-risk overrides</p>
          <p className="mb-2 text-xs text-muted-foreground">
            Any &quot;Yes&quot; pins the total to 100 and classifies HIGH risk — remaining
            questions are not required.
          </p>
          <div className="space-y-1">
            {model.overrides.map((o) => (
              <label key={o.name} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={answers.overrides[o.name] === true}
                  onChange={(e) => setOverride(o.name, e.target.checked)}
                />
                <span className="font-medium">{o.name}</span>
                {o.description && (
                  <span className="text-xs text-muted-foreground">— {o.description}</span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Factor tabs (multi-factor shape only — simple models are flat) */}
      {model.modelShape === 'MULTI_FACTOR' && model.factors.length > 1 && (
        <div className="flex flex-wrap gap-1 border-b">
          {model.factors.map((f, i) => (
            <button
              key={`${f.name}-${i}`}
              type="button"
              onClick={() => setActiveFactor(i)}
              className={`rounded-t-md px-3 py-1.5 text-sm ${
                i === fi ? 'border border-b-0 bg-background font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.name} ({f.weight}%)
            </button>
          ))}
        </div>
      )}

      {factor && model.modelShape === 'SIMPLE_WEIGHTED' && (
        <div className="space-y-2">
          {model.factors.map((f, i) => (
            <LeafRow
              key={`f${i}`}
              nodeKey={`f${i}`}
              node={{ name: f.name, description: f.description, weight: f.weight, scoring: f.scoring }}
              answers={answers}
              onAnswer={setNode}
            />
          ))}
        </div>
      )}

      {factor && model.modelShape === 'MULTI_FACTOR' && (
        <div className="space-y-4">
          {(factor.categories ?? []).map((cat, ci) => (
            <section key={`${cat.name}-${ci}`} className="rounded-lg border bg-muted/20 p-3">
              <p className="mb-2 text-sm font-semibold">
                {cat.name} <span className="text-xs font-normal text-muted-foreground">({cat.weight}% of tab)</span>
              </p>
              <div className="space-y-2">
                {(cat.subFactors ?? []).map((sub, si) => (
                  <LeafRow
                    key={`f${fi}.c${ci}.s${si}`}
                    nodeKey={`f${fi}.c${ci}.s${si}`}
                    node={sub}
                    answers={answers}
                    onAnswer={setNode}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default SurveyForm;
