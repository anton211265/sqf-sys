import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { useDirtyGuard } from 'components/layout/dirty-guard';
import { Badge } from 'components/ui/badge';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { CRC } from 'constants/routes';
import { useModelLifecycleAction, useRiskModel, useUpdateRiskModel } from 'hooks/useCrc';
import { useHasPermission } from 'hooks/useRbac';
import {
  AssessmentAnswers,
  CategoryNode,
  FactorNode,
  LeafScoring,
  OverrideFactor,
  ScoreMethod,
  Thresholds,
} from 'types/CrcTypes';
import { getApiResponseErrorMsg } from 'utils/apiHelper';
import SurveyForm from './SurveyForm';

const METHODS: { value: ScoreMethod; label: string }[] = [
  { value: 'NUMERIC_SCORING', label: 'Numeric (assessor scores in range)' },
  { value: 'LABEL_SELECTION', label: 'Label-based (points per label, optional sub-scoring)' },
  { value: 'CONDITIONAL_NUMERIC', label: 'Conditional numeric (>, <, = rules)' },
  { value: 'DROPDOWN_SELECTION', label: 'Dropdown options' },
  { value: 'COUNTRY_SELECTION', label: 'Country-based (CSV paste supported)' },
  { value: 'BOOLEAN', label: 'Boolean (Yes / No)' },
  { value: 'DATE_RANGE', label: 'Date range (in / out of window)' },
  { value: 'DATE_BASED', label: 'Date-based (before / after / on)' },
];

const DEFAULT_CONFIG: Record<ScoreMethod, Record<string, any>> = {
  NUMERIC_SCORING: { min: 0, max: 10 },
  LABEL_SELECTION: { min: 0, max: 10, labels: [{ label: 'Low', points: 0 }, { label: 'High', points: 10 }] },
  CONDITIONAL_NUMERIC: { conditions: [{ operator: 'GT', value: 0, points: 5 }] },
  DROPDOWN_SELECTION: { options: [{ label: 'Option A', points: 0 }, { label: 'Option B', points: 5 }] },
  COUNTRY_SELECTION: { countries: [] },
  BOOLEAN: { trueScore: 10, falseScore: 0 },
  DATE_RANGE: { startDate: '2026-01-01', endDate: '2026-12-31', inScore: 0, outScore: 5 },
  DATE_BASED: { operator: 'BEFORE', date: '2026-01-01', matchScore: 0, elseScore: 5 },
};

const PIE_COLORS = ['#0369A1', '#0F172A', '#0EA5E9', '#64748B', '#38BDF8', '#1E3A8A', '#7DD3FC', '#334155'];

const selectCls = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm';
const numCls = 'h-8 w-20 rounded-md border border-input bg-background px-2 text-sm';

const weightTotal = (nodes: { weight: number }[]) =>
  Math.round(nodes.reduce((s, n) => s + (Number(n.weight) || 0), 0) * 100) / 100;

function WeightBadge({ nodes }: { nodes: { weight: number }[] }) {
  const total = weightTotal(nodes);
  return (
    <Badge variant={Math.abs(total - 100) <= 0.01 ? 'green' : 'red'}>
      Σ {total}% {Math.abs(total - 100) <= 0.01 ? '✓' : '(must be 100)'}
    </Badge>
  );
}

function WeightPie({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  const rows = data.filter((d) => d.value > 0);
  if (!rows.length) return null;
  return (
    <div className="h-56 w-full min-w-56 flex-1 rounded-lg border bg-background p-2">
      <p className="px-2 pt-1 text-xs font-medium text-muted-foreground">{title}</p>
      <ResponsiveContainer width="100%" height="88%">
        <PieChart>
          <Pie data={rows} dataKey="value" nameKey="name" innerRadius="45%" outerRadius="75%">
            {rows.map((entry, i) => (
              <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: any) => `${v}%`} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Per-method configuration editor shown in the expanded leaf row. */
function ScoringEditor({
  scoring,
  onChange,
}: {
  scoring: LeafScoring | undefined;
  onChange: (s: LeafScoring) => void;
}) {
  const method = scoring?.method;
  const c = scoring?.config ?? {};
  const set = (patch: Record<string, any>) =>
    onChange({ method: method as ScoreMethod, config: { ...c, ...patch } });
  const setRows = (key: string, rows: any[]) => set({ [key]: rows });
  const [csvText, setCsvText] = React.useState('');

  return (
    <div className="space-y-2 rounded-md border bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <Label className="text-xs">Scoring method</Label>
        <select
          className={selectCls + ' max-w-96'}
          value={method ?? ''}
          onChange={(e) => {
            const m = e.target.value as ScoreMethod;
            onChange({ method: m, config: JSON.parse(JSON.stringify(DEFAULT_CONFIG[m])) });
          }}
        >
          <option value="">Select method…</option>
          {METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {method === 'NUMERIC_SCORING' && (
        <div className="flex items-center gap-2 text-sm">
          Range <input type="number" className={numCls} value={c.min ?? 0} onChange={(e) => set({ min: Number(e.target.value) })} />
          to <input type="number" className={numCls} value={c.max ?? 10} onChange={(e) => set({ max: Number(e.target.value) })} />
        </div>
      )}

      {method === 'LABEL_SELECTION' && (
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            Range <input type="number" className={numCls} value={c.min ?? 0} onChange={(e) => set({ min: Number(e.target.value) })} />
            to <input type="number" className={numCls} value={c.max ?? 10} onChange={(e) => set({ max: Number(e.target.value) })} />
            <span className="text-xs text-muted-foreground">highest label must award the max</span>
          </div>
          {(c.labels ?? []).map((l: any, i: number) => (
            <div key={i} className="space-y-1 rounded border bg-background p-2">
              <div className="flex items-center gap-2">
                <Input className="h-8" value={l.label} placeholder="Label" onChange={(e) => setRows('labels', c.labels.map((x: any, j: number) => (j === i ? { ...x, label: e.target.value } : x)))} />
                <input type="number" className={numCls} value={l.points} onChange={(e) => setRows('labels', c.labels.map((x: any, j: number) => (j === i ? { ...x, points: Number(e.target.value) } : x)))} />
                <span className="text-xs text-muted-foreground">pts</span>
                <Button size="sm" variant="ghost" onClick={() => setRows('labels', c.labels.filter((_: any, j: number) => j !== i))}>✕</Button>
              </div>
              <div className="pl-4">
                {(l.subOptions ?? []).map((s: any, si: number) => (
                  <div key={si} className="mb-1 flex items-center gap-2">
                    <Input className="h-7 text-xs" value={s.label} placeholder="Sub-option" onChange={(e) => setRows('labels', c.labels.map((x: any, j: number) => (j === i ? { ...x, subOptions: x.subOptions.map((y: any, k: number) => (k === si ? { ...y, label: e.target.value } : y)) } : x)))} />
                    <input type="number" className={numCls} value={s.points} onChange={(e) => setRows('labels', c.labels.map((x: any, j: number) => (j === i ? { ...x, subOptions: x.subOptions.map((y: any, k: number) => (k === si ? { ...y, points: Number(e.target.value) } : y)) } : x)))} />
                    <Button size="sm" variant="ghost" onClick={() => setRows('labels', c.labels.map((x: any, j: number) => (j === i ? { ...x, subOptions: x.subOptions.filter((_: any, k: number) => k !== si) } : x)))}>✕</Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={() => setRows('labels', c.labels.map((x: any, j: number) => (j === i ? { ...x, subOptions: [...(x.subOptions ?? []), { label: '', points: 0 }] } : x)))}>
                  + sub-scoring option (≤ {l.points} pts)
                </Button>
              </div>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => setRows('labels', [...(c.labels ?? []), { label: '', points: 0 }])}>+ label</Button>
        </div>
      )}

      {method === 'CONDITIONAL_NUMERIC' && (
        <div className="space-y-1 text-sm">
          {(c.conditions ?? []).map((r: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              If value
              <select className={selectCls + ' w-16'} value={r.operator} onChange={(e) => setRows('conditions', c.conditions.map((x: any, j: number) => (j === i ? { ...x, operator: e.target.value } : x)))}>
                <option value="GT">&gt;</option>
                <option value="LT">&lt;</option>
                <option value="EQ">=</option>
              </select>
              <input type="number" className={numCls} value={r.value} onChange={(e) => setRows('conditions', c.conditions.map((x: any, j: number) => (j === i ? { ...x, value: Number(e.target.value) } : x)))} />
              award <input type="number" className={numCls} value={r.points} onChange={(e) => setRows('conditions', c.conditions.map((x: any, j: number) => (j === i ? { ...x, points: Number(e.target.value) } : x)))} /> pts
              <Button size="sm" variant="ghost" onClick={() => setRows('conditions', c.conditions.filter((_: any, j: number) => j !== i))}>✕</Button>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">First matching rule wins; no match awards 0.</p>
          <Button size="sm" variant="outline" onClick={() => setRows('conditions', [...(c.conditions ?? []), { operator: 'GT', value: 0, points: 0 }])}>+ condition</Button>
        </div>
      )}

      {method === 'DROPDOWN_SELECTION' && (
        <div className="space-y-1 text-sm">
          {(c.options ?? []).map((o: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <Input className="h-8" value={o.label} placeholder="Option" onChange={(e) => setRows('options', c.options.map((x: any, j: number) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <input type="number" className={numCls} value={o.points} onChange={(e) => setRows('options', c.options.map((x: any, j: number) => (j === i ? { ...x, points: Number(e.target.value) } : x)))} />
              <span className="text-xs text-muted-foreground">pts</span>
              <Button size="sm" variant="ghost" onClick={() => setRows('options', c.options.filter((_: any, j: number) => j !== i))}>✕</Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => setRows('options', [...(c.options ?? []), { label: '', points: 0 }])}>+ option</Button>
        </div>
      )}

      {method === 'COUNTRY_SELECTION' && (
        <div className="space-y-2 text-sm">
          <p className="text-xs text-muted-foreground">
            {(c.countries ?? []).length} countries configured. Paste CSV rows (Country,Points)
            to replace the list — e.g. from your country risk classification sheet.
          </p>
          <textarea
            className="min-h-24 w-full rounded-md border border-input bg-background p-2 font-mono text-xs"
            placeholder={'Malaysia,2\nSingapore,1\nIran,10'}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const rows = csvText
                  .split('\n')
                  .map((line) => line.split(','))
                  .filter((parts) => parts.length >= 2 && parts[0].trim() && Number.isFinite(Number(parts[1])))
                  .map((parts) => ({ country: parts[0].trim(), points: Number(parts[1]) }));
                if (rows.length) setRows('countries', rows);
              }}
            >
              Apply CSV ({csvText.split('\n').filter((l) => l.includes(',')).length} rows)
            </Button>
            {(c.countries ?? []).slice(0, 6).map((o: any) => (
              <Badge key={o.country} variant="outline">{o.country}: {o.points}</Badge>
            ))}
            {(c.countries ?? []).length > 6 && <Badge variant="outline">+{c.countries.length - 6} more</Badge>}
          </div>
        </div>
      )}

      {method === 'BOOLEAN' && (
        <div className="flex items-center gap-2 text-sm">
          Yes = <input type="number" className={numCls} value={c.trueScore ?? 0} onChange={(e) => set({ trueScore: Number(e.target.value) })} /> pts,
          No = <input type="number" className={numCls} value={c.falseScore ?? 0} onChange={(e) => set({ falseScore: Number(e.target.value) })} /> pts
        </div>
      )}

      {method === 'DATE_RANGE' && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          Window <Input type="date" className="h-8 w-40" value={c.startDate ?? ''} onChange={(e) => set({ startDate: e.target.value })} />
          to <Input type="date" className="h-8 w-40" value={c.endDate ?? ''} onChange={(e) => set({ endDate: e.target.value })} />
          — inside = <input type="number" className={numCls} value={c.inScore ?? 0} onChange={(e) => set({ inScore: Number(e.target.value) })} /> pts,
          outside = <input type="number" className={numCls} value={c.outScore ?? 0} onChange={(e) => set({ outScore: Number(e.target.value) })} /> pts
        </div>
      )}

      {method === 'DATE_BASED' && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          If date is
          <select className={selectCls + ' w-28'} value={c.operator ?? 'BEFORE'} onChange={(e) => set({ operator: e.target.value })}>
            <option value="BEFORE">before</option>
            <option value="AFTER">after</option>
            <option value="ON">on</option>
          </select>
          <Input type="date" className="h-8 w-40" value={c.date ?? ''} onChange={(e) => set({ date: e.target.value })} />
          award <input type="number" className={numCls} value={c.matchScore ?? 0} onChange={(e) => set({ matchScore: Number(e.target.value) })} /> pts,
          else <input type="number" className={numCls} value={c.elseScore ?? 0} onChange={(e) => set({ elseScore: Number(e.target.value) })} /> pts
        </div>
      )}
    </div>
  );
}

/** Inline-editable leaf row (sub-factor, or factor in simple shape). */
function LeafEditor({
  node,
  onChange,
  onRemove,
}: {
  node: { name: string; description?: string; weight: number; scoring?: LeafScoring };
  onChange: (n: any) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <div className="rounded-md border bg-background p-2">
      <div className="flex items-center gap-2">
        <Input className="h-8 flex-1" value={node.name} placeholder="Name" onChange={(e) => onChange({ ...node, name: e.target.value })} />
        <Input className="h-8 flex-1" value={node.description ?? ''} placeholder="Description" onChange={(e) => onChange({ ...node, description: e.target.value })} />
        <input type="number" className={numCls} value={node.weight} onChange={(e) => onChange({ ...node, weight: Number(e.target.value) })} />
        <span className="text-xs text-muted-foreground">%</span>
        <Button size="sm" variant="outline" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Hide scoring' : node.scoring?.method ? `Scoring: ${node.scoring.method.replace(/_/g, ' ').toLowerCase()}` : 'Set scoring'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onRemove}>✕</Button>
      </div>
      {expanded && (
        <div className="mt-2">
          <ScoringEditor scoring={node.scoring} onChange={(s) => onChange({ ...node, scoring: s })} />
        </div>
      )}
    </div>
  );
}

const RiskModelBuilder: React.FC = () => {
  const { id } = useParams();
  const modelId = parseInt(id ?? '', 10);
  const navigate = useNavigate();
  const hasPermission = useHasPermission();
  const { setDirty } = useDirtyGuard();
  const { data: model, isLoading } = useRiskModel(Number.isInteger(modelId) ? modelId : null);
  const updateModel = useUpdateRiskModel();
  const lifecycle = useModelLifecycleAction();

  const [factors, setFactors] = React.useState<FactorNode[]>([]);
  const [overrides, setOverrides] = React.useState<OverrideFactor[]>([]);
  const [thresholds, setThresholds] = React.useState<Thresholds>({ low: [0, 20], medium: [21, 50], high: [51, 100] });
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [activeTab, setActiveTab] = React.useState(0);
  const [previewing, setPreviewing] = React.useState(false);
  const [previewAnswers, setPreviewAnswers] = React.useState<AssessmentAnswers>({ nodes: {}, overrides: {} });
  const [message, setMessage] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [loadedFor, setLoadedFor] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (model && model.id !== loadedFor) {
      setFactors(JSON.parse(JSON.stringify(model.factors ?? [])));
      setOverrides(JSON.parse(JSON.stringify(model.overrides ?? [])));
      setThresholds(model.thresholds);
      setName(model.riskModelName);
      setDescription(model.description ?? '');
      setLoadedFor(model.id);
      setDirty(false);
    }
  }, [model, loadedFor, setDirty]);

  if (isLoading || !model) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  const editable = model.status === 'DRAFT' && hasPermission('risk_models_edit');
  const touch = () => setDirty(true);

  const mutateFactors = (fn: (draft: FactorNode[]) => void) => {
    const draft = JSON.parse(JSON.stringify(factors));
    fn(draft);
    setFactors(draft);
    touch();
  };

  const save = async () => {
    setMessage(null);
    setErrors([]);
    try {
      await updateModel.mutateAsync({
        id: model.id,
        input: { riskModelName: name, description, thresholds, factors, overrides },
      });
      setDirty(false);
      setMessage('Draft saved.');
    } catch (e) {
      setErrors([getApiResponseErrorMsg(e)]);
    }
  };

  const runAction = async (action: 'submit' | 'check' | 'return' | 'reject' | 'publish' | 'archive') => {
    setMessage(null);
    setErrors([]);
    const note =
      action === 'return' || action === 'reject'
        ? window.prompt('Note for the maker (optional):') ?? undefined
        : undefined;
    try {
      await lifecycle.mutateAsync({ action, id: model.id, note });
      setMessage(
        action === 'submit' ? 'Submitted for verification by a second CO.' :
        action === 'check' ? 'Verified — awaiting Compliance Manager publish.' :
        action === 'publish' ? 'Published — the model is now available for assessments.' :
        action === 'archive' ? 'Archived.' : 'Returned to draft.',
      );
    } catch (e: any) {
      const data = e?.response?.data;
      if (Array.isArray(data?.errors)) setErrors(data.errors);
      else setErrors([getApiResponseErrorMsg(e)]);
    }
  };

  const factorPie = factors.map((f) => ({ name: f.name || '(unnamed)', value: Number(f.weight) || 0 }));
  const activeFactor = factors[Math.min(activeTab, Math.max(factors.length - 1, 0))];
  const categoryPie = (activeFactor?.categories ?? []).map((c) => ({ name: c.name || '(unnamed)', value: Number(c.weight) || 0 }));

  const statusBadge: Record<string, 'default' | 'amber' | 'blue' | 'green' | 'purple'> = {
    DRAFT: 'default', PENDING_CHECK: 'amber', CHECKED: 'blue', PUBLISHED: 'green', ARCHIVED: 'purple',
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button type="button" className="text-xs text-muted-foreground hover:underline" onClick={() => navigate(CRC.MODELS)}>
            ← Model library
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{model.riskModelName}</h1>
            <Badge variant={statusBadge[model.status]}>{model.status.replace('_', ' ')}</Badge>
            <Badge variant="outline">{model.modelShape === 'MULTI_FACTOR' ? 'Multi-factor' : 'Simple weighted'}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {model.riskModelNumber} · risk-points orientation (high score = high risk)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setPreviewing(!previewing)}>
            {previewing ? 'Back to builder' : 'Survey preview'}
          </Button>
          {editable && (
            <>
              <Button onClick={save} disabled={updateModel.isPending}>Save draft</Button>
              <Button variant="outline" onClick={() => runAction('submit')}>Submit for check</Button>
            </>
          )}
          {model.status === 'PENDING_CHECK' && hasPermission('risk_models_check') && (
            <>
              <Button onClick={() => runAction('check')}>Verify (checker)</Button>
              <Button variant="outline" onClick={() => runAction('return')}>Return to maker</Button>
            </>
          )}
          {model.status === 'CHECKED' && hasPermission('risk_models_publish') && (
            <>
              <Button onClick={() => runAction('publish')}>Approve &amp; publish (CM)</Button>
              <Button variant="outline" onClick={() => runAction('reject')}>Reject to draft</Button>
            </>
          )}
          {model.status === 'PUBLISHED' && hasPermission('risk_models_publish') && (
            <Button variant="outline" onClick={() => runAction('archive')}>Archive</Button>
          )}
        </div>
      </div>

      {message && <p className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-800">{message}</p>}
      {errors.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800">
          {errors.map((e) => (<p key={e}>• {e}</p>))}
        </div>
      )}
      {!editable && model.status !== 'DRAFT' && (
        <p className="rounded-md border bg-muted/40 p-2 text-xs text-muted-foreground">
          {model.status === 'PUBLISHED' || model.status === 'ARCHIVED'
            ? 'Published models are immutable — duplicate from the library to modify.'
            : 'This model is in the maker-checker chain and cannot be edited until returned to draft.'}
        </p>
      )}

      {previewing ? (
        <section className="rounded-lg border bg-background p-4">
          <p className="mb-3 text-sm font-medium">Survey preview — sample inputs only, nothing is recorded.</p>
          <SurveyForm
            model={{ modelShape: model.modelShape, factors, overrides, thresholds }}
            answers={previewAnswers}
            onChange={setPreviewAnswers}
          />
        </section>
      ) : (
        <>
          {/* Identity + thresholds */}
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2 rounded-lg border bg-background p-4">
              <Label htmlFor="rm-name">Model name</Label>
              <Input id="rm-name" value={name} disabled={!editable} onChange={(e) => { setName(e.target.value); touch(); }} />
              <Label htmlFor="rm-desc">Description</Label>
              <Input id="rm-desc" value={description} disabled={!editable} onChange={(e) => { setDescription(e.target.value); touch(); }} />
            </div>
            <div className="rounded-lg border bg-background p-4">
              <p className="mb-2 text-sm font-medium">Classification thresholds (risk points)</p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="green">LOW RISK</Badge> 0 –
                <input
                  type="number" className={numCls} disabled={!editable} value={thresholds.low[1]}
                  onChange={(e) => {
                    const lowMax = Number(e.target.value);
                    setThresholds({ low: [0, lowMax], medium: [lowMax + 1, thresholds.medium[1]], high: thresholds.high });
                    touch();
                  }}
                />
                <Badge variant="amber">MEDIUM</Badge> {thresholds.medium[0]} –
                <input
                  type="number" className={numCls} disabled={!editable} value={thresholds.medium[1]}
                  onChange={(e) => {
                    const medMax = Number(e.target.value);
                    setThresholds({ low: thresholds.low, medium: [thresholds.medium[0], medMax], high: [medMax + 1, 100] });
                    touch();
                  }}
                />
                <Badge variant="red">HIGH RISK</Badge> {thresholds.high[0]} – 100
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Bands are contiguous over 0–100. HIGH score = HIGH risk (opposite of Filter-1 — always read the label).
              </p>
            </div>
          </section>

          {/* Weight pies */}
          <section className="flex flex-wrap gap-4">
            <WeightPie title="Factor weight split" data={factorPie} />
            {model.modelShape === 'MULTI_FACTOR' && activeFactor && (
              <WeightPie title={`Categories in "${activeFactor.name || '(unnamed)'}"`} data={categoryPie} />
            )}
          </section>

          {/* Structure editor */}
          <section className="rounded-lg border bg-background p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">
                {model.modelShape === 'MULTI_FACTOR' ? 'Factors (tabs) → categories → sub-factors' : 'Factors'}
              </p>
              <div className="flex items-center gap-2">
                <WeightBadge nodes={factors} />
                {editable && (
                  <Button size="sm" variant="outline" onClick={() => mutateFactors((d) => { d.push(model.modelShape === 'MULTI_FACTOR' ? { name: '', weight: 0, categories: [] } : { name: '', weight: 0 }); setActiveTab(factors.length); })}>
                    + factor
                  </Button>
                )}
              </div>
            </div>

            {model.modelShape === 'SIMPLE_WEIGHTED' && (
              <div className="space-y-2">
                {factors.map((f, fi) => (
                  <LeafEditor
                    key={fi}
                    node={f}
                    onChange={(n) => { if (!editable) return; mutateFactors((d) => { d[fi] = n; }); }}
                    onRemove={() => { if (!editable) return; mutateFactors((d) => { d.splice(fi, 1); }); }}
                  />
                ))}
              </div>
            )}

            {model.modelShape === 'MULTI_FACTOR' && (
              <>
                <div className="mb-3 flex flex-wrap gap-1 border-b">
                  {factors.map((f, i) => (
                    <button key={i} type="button" onClick={() => setActiveTab(i)}
                      className={`rounded-t-md px-3 py-1.5 text-sm ${i === Math.min(activeTab, factors.length - 1) ? 'border border-b-0 bg-background font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
                      {f.name || `(factor ${i + 1})`}
                    </button>
                  ))}
                </div>
                {activeFactor && (() => {
                  const fi = Math.min(activeTab, factors.length - 1);
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input className="h-8 max-w-64" disabled={!editable} value={activeFactor.name} placeholder="Factor (tab) name" onChange={(e) => mutateFactors((d) => { d[fi].name = e.target.value; })} />
                        <Input className="h-8 flex-1" disabled={!editable} value={activeFactor.description ?? ''} placeholder="Description" onChange={(e) => mutateFactors((d) => { d[fi].description = e.target.value; })} />
                        <input type="number" className={numCls} disabled={!editable} value={activeFactor.weight} onChange={(e) => mutateFactors((d) => { d[fi].weight = Number(e.target.value); })} />
                        <span className="text-xs text-muted-foreground">% weight</span>
                        {editable && <Button size="sm" variant="ghost" onClick={() => { mutateFactors((d) => { d.splice(fi, 1); }); setActiveTab(0); }}>Delete tab</Button>}
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground">Categories in this tab</p>
                        <div className="flex items-center gap-2">
                          <WeightBadge nodes={activeFactor.categories ?? []} />
                          {editable && (
                            <Button size="sm" variant="outline" onClick={() => mutateFactors((d) => { (d[fi].categories = d[fi].categories ?? []).push({ name: '', weight: 0, subFactors: [] }); })}>
                              + category
                            </Button>
                          )}
                        </div>
                      </div>

                      {(activeFactor.categories ?? []).map((cat: CategoryNode, ci: number) => (
                        <div key={ci} className="rounded-lg border bg-muted/20 p-3">
                          <div className="mb-2 flex items-center gap-2">
                            <Input className="h-8 max-w-64" disabled={!editable} value={cat.name} placeholder="Category name" onChange={(e) => mutateFactors((d) => { d[fi].categories![ci].name = e.target.value; })} />
                            <Input className="h-8 flex-1" disabled={!editable} value={cat.description ?? ''} placeholder="Description" onChange={(e) => mutateFactors((d) => { d[fi].categories![ci].description = e.target.value; })} />
                            <input type="number" className={numCls} disabled={!editable} value={cat.weight} onChange={(e) => mutateFactors((d) => { d[fi].categories![ci].weight = Number(e.target.value); })} />
                            <span className="text-xs text-muted-foreground">%</span>
                            <WeightBadge nodes={cat.subFactors ?? []} />
                            {editable && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => mutateFactors((d) => { d[fi].categories![ci].subFactors.push({ name: '', weight: 0 }); })}>+ sub-factor</Button>
                                <Button size="sm" variant="ghost" onClick={() => mutateFactors((d) => { d[fi].categories!.splice(ci, 1); })}>✕</Button>
                              </>
                            )}
                          </div>
                          <div className="space-y-2">
                            {(cat.subFactors ?? []).map((sub, si) => (
                              <LeafEditor
                                key={si}
                                node={sub}
                                onChange={(n) => { if (!editable) return; mutateFactors((d) => { d[fi].categories![ci].subFactors[si] = n; }); }}
                                onRemove={() => { if (!editable) return; mutateFactors((d) => { d[fi].categories![ci].subFactors.splice(si, 1); }); }}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </>
            )}
          </section>

          {/* Straight high-risk overrides */}
          <section className="rounded-lg border bg-background p-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Straight high-risk overrides</p>
                <p className="text-xs text-muted-foreground">Any &quot;Yes&quot; during assessment pins the score to 100 → HIGH risk.</p>
              </div>
              {editable && (
                <Button size="sm" variant="outline" onClick={() => { setOverrides([...overrides, { name: '' }]); touch(); }}>+ override</Button>
              )}
            </div>
            <div className="space-y-2">
              {overrides.length === 0 && <p className="text-xs text-muted-foreground">None configured.</p>}
              {overrides.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input className="h-8 max-w-64" disabled={!editable} value={o.name} placeholder="e.g. Sanctions hit" onChange={(e) => { const next = [...overrides]; next[i] = { ...o, name: e.target.value }; setOverrides(next); touch(); }} />
                  <Input className="h-8 flex-1" disabled={!editable} value={o.description ?? ''} placeholder="Description" onChange={(e) => { const next = [...overrides]; next[i] = { ...o, description: e.target.value }; setOverrides(next); touch(); }} />
                  {editable && <Button size="sm" variant="ghost" onClick={() => { setOverrides(overrides.filter((_, j) => j !== i)); touch(); }}>✕</Button>}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default RiskModelBuilder;
