import * as React from 'react';

import { Badge } from 'components/ui/badge';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { Sheet } from 'components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'components/ui/table';
import { useAssessment, useAssessments, useConductAssessment, useRiskModel, useRiskModels } from 'hooks/useCrc';
import { useHasPermission } from 'hooks/useRbac';
import { classificationBadge, computeLive } from 'lib/crcScoring';
import { AssessmentAnswers } from 'types/CrcTypes';
import { getApiResponseErrorMsg } from 'utils/apiHelper';
import SurveyForm from './SurveyForm';

const EMPTY_ANSWERS: AssessmentAnswers = { nodes: {}, overrides: {} };

/**
 * Run a client through a published Filter-2 model (risk_assessments_conduct)
 * and browse the append-only assessment history (risk_assessments_view).
 * Client selection is manual organizationId entry in pass 1 — the client
 * registry integration arrives with the CRC dashboard queue.
 */
const RunAssessment: React.FC = () => {
  const hasPermission = useHasPermission();
  const canConduct = hasPermission('risk_assessments_conduct');
  const { data: published = [] } = useRiskModels('PUBLISHED');
  const { data: history = [] } = useAssessments();
  const conduct = useConductAssessment();

  const [modelId, setModelId] = React.useState<number | null>(null);
  const { data: model } = useRiskModel(modelId);
  const [orgId, setOrgId] = React.useState('');
  const [orgName, setOrgName] = React.useState('');
  const [answers, setAnswers] = React.useState<AssessmentAnswers>(EMPTY_ANSWERS);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{ totalScore: number; classification: 'LOW' | 'MEDIUM' | 'HIGH'; overrideTripped: boolean } | null>(null);
  const [detailId, setDetailId] = React.useState<number | null>(null);
  const { data: detail } = useAssessment(detailId);

  const live = model
    ? computeLive({ modelShape: model.modelShape, factors: model.factors, overrides: model.overrides, thresholds: model.thresholds }, answers)
    : null;

  const submit = async () => {
    if (!model) return;
    setError(null);
    setResult(null);
    try {
      const res = await conduct.mutateAsync({
        riskModelId: model.id,
        organizationId: parseInt(orgId, 10),
        organizationName: orgName || undefined,
        answers,
      });
      setResult(res);
      setAnswers(EMPTY_ANSWERS);
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Risk Filter 2 — Run Assessment</h1>
        <p className="text-sm text-muted-foreground">
          Qualitative scoring against a published model. Scores are risk points:
          high score = high risk. Results are recorded append-only per client.
        </p>
      </div>

      {canConduct && (
        <section className="space-y-4 rounded-lg border bg-background p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label htmlFor="assess-model">Published model</Label>
              <select
                id="assess-model"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={modelId ?? ''}
                onChange={(e) => {
                  setModelId(e.target.value ? parseInt(e.target.value, 10) : null);
                  setAnswers(EMPTY_ANSWERS);
                  setResult(null);
                }}
              >
                <option value="">Select model…</option>
                {published.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.riskModelName} ({m.riskModelNumber})
                  </option>
                ))}
              </select>
              {published.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">No published models yet.</p>
              )}
            </div>
            <div>
              <Label htmlFor="assess-org">Client organization id</Label>
              <Input id="assess-org" type="number" value={orgId} onChange={(e) => setOrgId(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="assess-org-name">Client name (display)</Label>
              <Input id="assess-org-name" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
            </div>
          </div>

          {model && (
            <>
              <SurveyForm
                model={{ modelShape: model.modelShape, factors: model.factors, overrides: model.overrides, thresholds: model.thresholds }}
                answers={answers}
                onChange={(a) => { setAnswers(a); setResult(null); }}
              />
              <div className="flex items-center gap-3">
                <Button
                  onClick={submit}
                  disabled={conduct.isPending || !orgId || !(live?.complete || live?.overrideTripped)}
                >
                  Show result &amp; record assessment
                </Button>
                {!live?.complete && !live?.overrideTripped && (
                  <span className="text-xs text-muted-foreground">Answer all questions (or trip an override) to submit.</span>
                )}
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              {result && (
                <div className="flex items-center gap-3 rounded-md border bg-muted/40 p-3">
                  <span className="text-sm">Recorded result:</span>
                  <span className="text-lg font-semibold">{result.totalScore} / 100</span>
                  <Badge variant={classificationBadge(result.classification)}>
                    {result.classification} RISK{result.overrideTripped ? ' (OVERRIDE)' : ''}
                  </Badge>
                </div>
              )}
            </>
          )}
        </section>
      )}

      <section className="rounded-lg border bg-background p-4">
        <h2 className="mb-3 font-medium">Assessment history</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Classification</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">No assessments yet.</TableCell>
              </TableRow>
            )}
            {history.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</TableCell>
                <TableCell className="font-medium">{a.organizationName ?? `org #${a.organizationId}`}</TableCell>
                <TableCell className="text-xs">{a.riskModelName}</TableCell>
                <TableCell>{a.totalScore}</TableCell>
                <TableCell>
                  <Badge variant={classificationBadge(a.classification)}>
                    {a.classification} RISK{a.overrideTripped ? ' (OVERRIDE)' : ''}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => setDetailId(a.id)}>Detail</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <Sheet open={detailId !== null} onOpenChange={() => setDetailId(null)}>
        {detail && (
          <div className="space-y-4 text-sm">
            <h2 className="text-lg font-semibold">Assessment #{detail.id}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{detail.organizationName ?? `org #${detail.organizationId}`}</span>
              <Badge variant={classificationBadge(detail.classification)}>
                {detail.classification} RISK
              </Badge>
              <span>{detail.totalScore} / 100</span>
              <span className="text-xs text-muted-foreground">
                {detail.riskModelName} ({detail.riskModelNumber}) · {new Date(detail.createdAt).toLocaleString()}
              </span>
            </div>
            {detail.overrideTripped && (
              <p className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">
                Straight high-risk override tripped: {(detail.overrideFactors ?? []).join(', ')}
              </p>
            )}
            {detail.answers.length > 0 && (
              <div>
                <p className="mb-1 font-medium">Answers &amp; contributions</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Answer</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Contribution</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.answers.map((row) => (
                      <TableRow key={row.nodeKey}>
                        <TableCell className="text-xs">{row.nodeName}</TableCell>
                        <TableCell className="text-xs">
                          {typeof row.rawValue === 'object' && row.rawValue !== null
                            ? `${row.rawValue.label}${row.rawValue.subOption ? ` → ${row.rawValue.subOption}` : ''}`
                            : String(row.rawValue)}
                        </TableCell>
                        <TableCell className="text-xs">{row.points}</TableCell>
                        <TableCell className="text-xs">
                          {row.weightedContribution === null ? '—' : `+${Math.round(row.weightedContribution * 100) / 100}`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              The model structure is snapshotted inside this assessment — later edits to
              the model never change this record.
            </p>
          </div>
        )}
      </Sheet>
    </div>
  );
};

export default RunAssessment;
