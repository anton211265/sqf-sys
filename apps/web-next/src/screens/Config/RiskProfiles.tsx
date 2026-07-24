import * as React from 'react';

import { Badge } from 'components/ui/badge';
import { Button } from 'components/ui/button';
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
import { useConfigProducts } from 'hooks/useConfigurator';
import { useRiskModels } from 'hooks/useCrc';
import { useHasPermission, useManifest } from 'hooks/useRbac';
import {
  useApproveChangeRequest,
  useAssignProductRiskFilter,
  useChangeRequests,
  useCreateChangeRequest,
  useProductRiskFilters,
  useRejectChangeRequest,
  useRiskProfiles,
} from 'hooks/useRiskGovernance';
import { cn } from 'lib/utils';
import { getApiResponseErrorMsg } from 'utils/apiHelper';

/**
 * Risk Profile by Product (wireframe 7): default Filter-1 parameter
 * weights behind a maker-checker flow (risk_profiles_edit proposes,
 * risk_profiles_approve decides, never the same person — enforced
 * server-side), band semantics displayed per the ruling (HIGH score = LOW
 * risk), and the Filter-2 profile → product assignment
 * (config_risk_filters_assign) read from the product-configurator.
 */
const RiskProfiles: React.FC = () => {
  const { data: profiles = [], isLoading } = useRiskProfiles();
  const { data: requests = [] } = useChangeRequests();
  const { data: products = [] } = useConfigProducts();
  const { data: manifest } = useManifest();
  const hasPermission = useHasPermission();
  const canEdit = hasPermission('risk_profiles_edit');
  const canApprove = hasPermission('risk_profiles_approve');
  const canAssignFilters = hasPermission('config_risk_filters_assign');

  const createRequest = useCreateChangeRequest();
  const approveRequest = useApproveChangeRequest();
  const rejectRequest = useRejectChangeRequest();
  const assignFilter = useAssignProductRiskFilter();

  const [selectedCode, setSelectedCode] = React.useState<string | null>(null);
  const [draftWeights, setDraftWeights] = React.useState<Record<number, string>>({});
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const selected =
    profiles.find((p) => p.riskProfileCode === selectedCode) ??
    profiles.find((p) => p.isDefault) ??
    profiles[0];

  React.useEffect(() => {
    if (selected) {
      setDraftWeights(
        Object.fromEntries(selected.weights.map((w) => [w.weightId, String(w.weight)])),
      );
    }
    setError(null);
    setNotice(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.riskProfileCode, selected?.weights.map((w) => w.weight).join(',')]);

  const pendingForSelected = requests.find(
    (r) => r.status === 'PENDING' && r.riskProfileCode === selected?.riskProfileCode,
  );

  const draftTotal = selected
    ? selected.weights.reduce(
        (sum, w) => sum + (parseFloat(draftWeights[w.weightId] ?? '') || 0),
        0,
      )
    : 0;
  const dirty =
    selected?.weights.some(
      (w) => parseFloat(draftWeights[w.weightId] ?? '') !== w.weight,
    ) ?? false;

  const submitChangeRequest = async () => {
    if (!selected) return;
    setError(null);
    setNotice(null);
    try {
      const changes = selected.weights
        .filter((w) => parseFloat(draftWeights[w.weightId] ?? '') !== w.weight)
        .map((w) => ({
          weightId: w.weightId,
          newWeight: parseFloat(draftWeights[w.weightId]),
        }));
      await createRequest.mutateAsync({
        riskProfileCode: selected.riskProfileCode,
        weights: changes,
        reason: reason.trim() || undefined,
      });
      setReason('');
      setNotice('Change request submitted — awaiting Risk Operations Manager approval.');
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    }
  };

  const decide = async (requestId: number, decision: 'approve' | 'reject') => {
    setError(null);
    setNotice(null);
    try {
      if (decision === 'approve') {
        await approveRequest.mutateAsync(requestId);
        setNotice('Change approved and applied to the live profile.');
      } else {
        await rejectRequest.mutateAsync({ id: requestId, note: 'rejected from portal' });
        setNotice('Change request rejected.');
      }
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    }
  };

  // ---- Filter-2 → product assignment ----
  // Since CRC pass 1 the assignment source is PUBLISHED risk models from
  // the CRC model library (the stored riskProfileCode carries the model's
  // RM_ code). Listing them needs risk_models_view; without it the current
  // assignment still displays read-only.
  const productIds = products.map((p) => p.id);
  const { data: filterAssignments = {} } = useProductRiskFilters(productIds);
  const canListModels = hasPermission('risk_models_view');
  const { data: publishedModels = [] } = useRiskModels('PUBLISHED', canListModels);

  const myPersonId = manifest?.user?.personId;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Risk Profiles</h1>
        <p className="text-sm text-muted-foreground">
          Default Filter-1 weights (maker-checker) and Filter-2 profile
          assignment by product
        </p>
      </div>
      {(error || notice) && (
        <div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {notice && <p className="text-sm text-emerald-700">{notice}</p>}
        </div>
      )}

      <div className="flex flex-col gap-6 xl:flex-row">
        {/* Weights editor */}
        <section className="flex-1 rounded-lg border bg-background p-4">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-medium">Filter-1 Parameter Weights</h2>
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              value={selected?.riskProfileCode ?? ''}
              onChange={(e) => setSelectedCode(e.target.value)}
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.riskProfileCode}>
                  {p.riskProfileCode}
                  {p.isDefault ? ' (default)' : ''}
                </option>
              ))}
            </select>
          </div>

          {isLoading && <p className="text-sm text-muted-foreground">Loading profiles…</p>}
          {selected && (
            <>
              <div className="mb-4 space-y-2">
                {selected.weights.map((w) => (
                  <div key={w.weightId} className="flex items-center gap-3">
                    <span className="w-44 text-sm">{w.parameterName}</span>
                    <Input
                      aria-label={`weight-${w.parameterName}`}
                      className="w-24"
                      value={draftWeights[w.weightId] ?? ''}
                      disabled={!canEdit || !!pendingForSelected}
                      onChange={(e) =>
                        setDraftWeights({ ...draftWeights, [w.weightId]: e.target.value })
                      }
                    />
                    {parseFloat(draftWeights[w.weightId] ?? '') !== w.weight && (
                      <span className="text-xs text-amber-700">was {w.weight}</span>
                    )}
                  </div>
                ))}
                <div
                  className={cn(
                    'text-sm font-medium',
                    Math.abs(draftTotal - 100) > 0.01 ? 'text-destructive' : 'text-emerald-700',
                  )}
                >
                  Total: {draftTotal} / 100
                </div>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                Bands (HIGH score = LOW risk):
                <Badge variant="green">
                  LOW RISK {selected.bands.low[0]}–{selected.bands.low[1]}
                </Badge>
                <Badge variant="amber">
                  MEDIUM {selected.bands.medium[0]}–{selected.bands.medium[1]}
                </Badge>
                <Badge variant="red">
                  HIGH RISK {selected.bands.high[0]}–{selected.bands.high[1]}
                </Badge>
              </div>

              {canEdit && !pendingForSelected && (
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="rp-reason">Change reason (optional)</Label>
                    <Input
                      id="rp-reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>
                  <Button
                    disabled={!dirty || Math.abs(draftTotal - 100) > 0.01 || createRequest.isPending}
                    onClick={submitChangeRequest}
                  >
                    Submit Change Request
                  </Button>
                </div>
              )}
              {pendingForSelected && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  Change request #{pendingForSelected.id} is pending approval —
                  weights are locked until it is decided.
                </div>
              )}
            </>
          )}
        </section>

        {/* Approvals */}
        <section className="flex-1 rounded-lg border bg-background p-4">
          <h2 className="mb-3 font-medium">Pending Approvals (Risk Operations Manager)</h2>
          {requests.filter((r) => r.status === 'PENDING').length === 0 && (
            <p className="text-sm text-muted-foreground">No pending change requests.</p>
          )}
          {requests
            .filter((r) => r.status === 'PENDING')
            .map((request) => (
              <div key={request.id} className="mb-3 rounded-md border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    #{request.id} · {request.riskProfileCode}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    by person #{request.requestedByPersonId}
                    {request.requestedByPersonId === myPersonId && ' (you)'}
                  </span>
                </div>
                <table className="mb-2 w-full text-xs">
                  <tbody>
                    {request.proposedWeights.map((change) => (
                      <tr key={change.weightId}>
                        <td className="py-0.5 pr-2">{change.parameterName}</td>
                        <td className="py-0.5 text-muted-foreground">
                          {change.oldWeight} → <strong>{change.newWeight}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {request.requestReason && (
                  <p className="mb-2 text-xs text-muted-foreground">
                    Reason: {request.requestReason}
                  </p>
                )}
                {canApprove && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={approveRequest.isPending}
                      onClick={() => decide(request.id, 'approve')}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={rejectRequest.isPending}
                      onClick={() => decide(request.id, 'reject')}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          <h3 className="mb-1 mt-4 text-sm font-medium text-muted-foreground">Recent decisions</h3>
          {requests
            .filter((r) => r.status !== 'PENDING')
            .slice(0, 5)
            .map((request) => (
              <div key={request.id} className="flex items-center gap-2 py-1 text-xs">
                <Badge variant={request.status === 'APPROVED' ? 'green' : 'red'}>
                  {request.status}
                </Badge>
                <span>
                  #{request.id} {request.riskProfileCode}
                </span>
                <span className="text-muted-foreground">
                  decided by #{request.decidedByPersonId}
                </span>
              </div>
            ))}
        </section>
      </div>

      {/* Filter-2 assignment */}
      <section className="rounded-lg border bg-background p-4">
        <h2 className="mb-3 font-medium">Second-Filter Profile → Product Assignment</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Assigned Filter-2 profile</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-muted-foreground">
                  No products in the registry yet.
                </TableCell>
              </TableRow>
            )}
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <span className="font-mono font-medium">{product.productCode}</span>{' '}
                  <span className="text-muted-foreground">{product.productName}</span>
                </TableCell>
                <TableCell>
                  <select
                    aria-label={`filter2-${product.productCode}`}
                    className="h-9 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm"
                    value={filterAssignments[product.id] ?? ''}
                    disabled={!canAssignFilters || assignFilter.isPending}
                    onChange={async (e) => {
                      setError(null);
                      try {
                        await assignFilter.mutateAsync({
                          productId: product.id,
                          riskProfileCode: e.target.value || null,
                        });
                      } catch (err) {
                        setError(getApiResponseErrorMsg(err));
                      }
                    }}
                  >
                    <option value="">(none — default profile only)</option>
                    {publishedModels.map((m) => (
                      <option key={m.id} value={m.riskModelNumber}>
                        {m.riskModelNumber} — {m.riskModelName}
                      </option>
                    ))}
                    {/* keep an unknown stored code selectable/displayed */}
                    {filterAssignments[product.id] &&
                      !publishedModels.some((m) => m.riskModelNumber === filterAssignments[product.id]) && (
                        <option value={filterAssignments[product.id] as string}>
                          {filterAssignments[product.id]}
                        </option>
                      )}
                  </select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="mt-2 text-xs text-muted-foreground">
          Filter-2 risk models are authored in the Credit Risk &amp; Compliance
          domain (maker-checker publish); this screen assigns a published
          model as the product&apos;s default second filter — the CO can still
          pick any published model at assessment time.
        </p>
      </section>
    </div>
  );
};

export default RiskProfiles;
