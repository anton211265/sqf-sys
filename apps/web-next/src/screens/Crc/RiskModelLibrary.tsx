import * as React from 'react';
import { useNavigate } from 'react-router-dom';

import { Badge } from 'components/ui/badge';
import { Button } from 'components/ui/button';
import { Dialog, DialogDescription, DialogFooter, DialogTitle } from 'components/ui/dialog';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'components/ui/table';
import { CRC } from 'constants/routes';
import { useCreateRiskModel, useRiskModels } from 'hooks/useCrc';
import { useHasPermission } from 'hooks/useRbac';
import { ModelStatus } from 'types/CrcTypes';
import { getApiResponseErrorMsg } from 'utils/apiHelper';

const STATUS_BADGE: Record<ModelStatus, 'default' | 'blue' | 'amber' | 'green' | 'purple'> = {
  DRAFT: 'default',
  PENDING_CHECK: 'amber',
  CHECKED: 'blue',
  PUBLISHED: 'green',
  ARCHIVED: 'purple',
};

/**
 * Filter-2 Risk Model Library (gate: risk_models_view). Authoring lives in
 * the builder; publishing is maker-checker (CO maker → CO checker → CM).
 */
const RiskModelLibrary: React.FC = () => {
  const navigate = useNavigate();
  const hasPermission = useHasPermission();
  const { data: models = [], isLoading } = useRiskModels();
  const createModel = useCreateRiskModel();

  const [creating, setCreating] = React.useState(false);
  const [name, setName] = React.useState('');
  const [shape, setShape] = React.useState<'MULTI_FACTOR' | 'SIMPLE_WEIGHTED'>('MULTI_FACTOR');
  const [duplicateFrom, setDuplicateFrom] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const canEdit = hasPermission('risk_models_edit');

  const submitCreate = async () => {
    setError(null);
    try {
      const created = await createModel.mutateAsync({
        riskModelName: name.trim(),
        modelShape: duplicateFrom ? undefined : shape,
        duplicateFromId: duplicateFrom ? parseInt(duplicateFrom, 10) : undefined,
      });
      setCreating(false);
      navigate(CRC.MODELS + '/' + created.id);
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Risk Filter 2 — Model Library</h1>
          <p className="text-sm text-muted-foreground">
            Qualitative risk models (risk-points: high score = high risk). Publishing is
            maker-checker: CO builds, a second CO verifies, the Compliance Manager publishes.
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => { setError(null); setName(''); setDuplicateFrom(''); setCreating(true); }}>
            + New model
          </Button>
        )}
      </div>

      <section className="rounded-lg border bg-background p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Shape</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Thresholds (L / M / H)</TableHead>
              <TableHead>Published</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading && models.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  No models yet{canEdit ? ' — create the first one.' : '.'}
                </TableCell>
              </TableRow>
            )}
            {models.map((m) => (
              <TableRow
                key={m.id}
                className="cursor-pointer"
                onClick={() => navigate(CRC.MODELS + '/' + m.id)}
              >
                <TableCell className="font-mono text-xs">{m.riskModelNumber}</TableCell>
                <TableCell className="font-medium">{m.riskModelName}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {m.modelShape === 'MULTI_FACTOR' ? 'Multi-factor' : 'Simple weighted'}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_BADGE[m.status]}>{m.status.replace('_', ' ')}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {m.thresholds.low[0]}–{m.thresholds.low[1]} / {m.thresholds.medium[0]}–
                  {m.thresholds.medium[1]} / {m.thresholds.high[0]}–{m.thresholds.high[1]}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {m.publishedAt ? new Date(m.publishedAt).toLocaleDateString() : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <Dialog open={creating} onOpenChange={() => setCreating(false)}>
        <DialogTitle>New risk model</DialogTitle>
        <DialogDescription>
          Start from a structural template or duplicate an existing model.
        </DialogDescription>
        <div className="space-y-3">
          <div>
            <Label htmlFor="model-name">Model name</Label>
            <Input id="model-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="model-duplicate">Duplicate existing (optional)</Label>
            <select
              id="model-duplicate"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={duplicateFrom}
              onChange={(e) => setDuplicateFrom(e.target.value)}
            >
              <option value="">Start blank</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.riskModelName} ({m.riskModelNumber})
                </option>
              ))}
            </select>
          </div>
          {!duplicateFrom && (
            <div>
              <Label htmlFor="model-shape">Template</Label>
              <select
                id="model-shape"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={shape}
                onChange={(e) => setShape(e.target.value as any)}
              >
                <option value="MULTI_FACTOR">Multi-factor (tabs → categories → sub-factors)</option>
                <option value="SIMPLE_WEIGHTED">Simple weighted (flat factor list)</option>
              </select>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
          <Button disabled={!name.trim() || createModel.isPending} onClick={submitCreate}>
            Create draft
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default RiskModelLibrary;
