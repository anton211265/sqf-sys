import * as React from 'react';

import { Badge } from 'components/ui/badge';
import { Button } from 'components/ui/button';
import { Sheet } from 'components/ui/sheet';
import { useOpsCaseAction, useOpsCases } from 'hooks/useOperations';
import { useHasPermission } from 'hooks/useRbac';
import { OperationsCaseRow } from 'service/operations';
import { getApiResponseErrorMsg } from 'utils/apiHelper';

const COLUMNS: { status: string; title: string }[] = [
  { status: 'NEW', title: 'New clients' },
  { status: 'IN_PREPARATION', title: 'In preparation' },
  { status: 'PENDING_CHECK', title: 'Pending check' },
  { status: 'CHECKED', title: 'Awaiting OM approval' },
  { status: 'PENDING_SIGNATURE', title: 'With client signatory' },
  { status: 'EXECUTED', title: 'Facility executed' },
];

/**
 * Operations Hub — Product Approval kanban (blueprint §1): operator picks
 * up an onboarded client, prepares the agreement pack, a second operator
 * verifies, the Operations Manager approves, the client signs by passkey
 * and the facility goes live as a FACILITY_AGREEMENT contract.
 */
const OperationsDashboard: React.FC = () => {
  const hasPermission = useHasPermission();
  const { data: cases = [] } = useOpsCases();
  const action = useOpsCaseAction();
  const [open, setOpen] = React.useState<OperationsCaseRow | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const canManage = hasPermission('ops_agreements_manage');
  const canCheck = hasPermission('ops_agreements_check');
  const canApprove = hasPermission('ops_agreements_approve');

  const run = async (id: number, a: string, note?: string) => {
    setError(null);
    try {
      await action.mutateAsync({ id, action: a, note });
      setOpen(null);
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    }
  };

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-semibold">Operations Hub</h1>
        <p className="text-sm text-muted-foreground">
          Product Approval: agreement pack (operator maker → second operator check →
          Operations Manager) → client passkey signature → facility in force.
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {COLUMNS.map((col) => (
          <div key={col.status} className="rounded-lg border bg-muted/20 p-2">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {col.title} ({cases.filter((c) => c.status === col.status).length})
            </p>
            <div className="space-y-2">
              {cases.filter((c) => c.status === col.status).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setOpen(c)}
                  className="w-full rounded-md border bg-background p-2 text-left text-sm hover:border-primary"
                >
                  <div className="font-medium">{c.companyName ?? `org #${c.organizationId}`}</div>
                  <div className="text-xs text-muted-foreground">{c.productCode} · case {c.id}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Sheet open={open !== null} onOpenChange={() => setOpen(null)}>
        {open && (
          <div className="space-y-3 text-sm">
            <h2 className="text-lg font-semibold">{open.companyName ?? `org #${open.organizationId}`}</h2>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{open.productCode}</Badge>
              <Badge>{open.status.replace(/_/g, ' ')}</Badge>
              {open.contractId && <Badge variant="green">CONTRACT #{open.contractId}</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">
              Operator {open.operatorPersonId ?? '—'}
              {open.checkerPersonId ? ` · checked by ${open.checkerPersonId}` : ''}
              {open.approverPersonId ? ` · approved by ${open.approverPersonId}` : ''}
              {open.signedAt ? ` · signed ${new Date(open.signedAt).toLocaleString()} (credential ${open.signedCredentialId?.slice(0, 12)}…)` : ''}
            </p>
            {open.agreementText && (
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-xs">
                {open.agreementText}
              </pre>
            )}
            {open.agreementSha256 && (
              <p className="text-[11px] text-muted-foreground">Pack SHA-256: {open.agreementSha256}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {open.status === 'NEW' && canManage && (
                <Button onClick={() => run(open.id, 'pickup')}>Pick up &amp; prepare pack</Button>
              )}
              {open.status === 'IN_PREPARATION' && canManage && (
                <Button onClick={() => run(open.id, 'submit')}>Submit for check</Button>
              )}
              {open.status === 'PENDING_CHECK' && canCheck && (
                <>
                  <Button onClick={() => run(open.id, 'check')}>Verify (2nd operator)</Button>
                  <Button variant="outline" onClick={() => run(open.id, 'return', window.prompt('Note:') ?? undefined)}>Return</Button>
                </>
              )}
              {open.status === 'CHECKED' && canApprove && (
                <Button onClick={() => run(open.id, 'approve')}>Approve → send for signature (OM)</Button>
              )}
              {open.status === 'PENDING_SIGNATURE' && (
                <p className="text-xs text-muted-foreground">
                  Awaiting the client signatory in the portal (passkey e-signature).
                </p>
              )}
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
};

export default OperationsDashboard;
