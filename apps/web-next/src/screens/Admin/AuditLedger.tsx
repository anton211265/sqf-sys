import * as React from 'react';
import { Download } from 'lucide-react';

import { Badge } from 'components/ui/badge';
import { Button } from 'components/ui/button';
import { Sheet } from 'components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'components/ui/table';
import {
  useAudit,
  useAuthEvents,
  useHasPermission,
  useRevokeSessions,
  useSessions,
  useUsers,
} from 'hooks/useRbac';
import { AuditRow } from 'types/RbacTypes';

const PAGE_SIZE = 50;

type Feed = 'config' | 'auth' | 'sessions';

// Auth-event risk mapping (same traffic-light rules as the RBAC feed)
const authRiskOf = (event: string, outcome: string): { label: string; variant: 'red' | 'amber' | 'default' } => {
  if (['REFRESH_THEFT', 'QR_LOGIN_REJECTED', 'LOGIN_LOCKED', 'LOGIN_BLOCKED'].includes(event)) {
    return { label: 'HIGH', variant: 'red' };
  }
  if (outcome === 'FAILURE') return { label: 'MED', variant: 'amber' };
  return { label: 'LOW', variant: 'default' };
};

// Traffic-light risk levels derived from event type — always paired with a
// text label per the dashboard standard.
const riskOf = (event: string): { label: string; variant: 'red' | 'amber' | 'default' } => {
  if (['TAMPER_ATTEMPT', 'SESSIONS_REVOKED'].includes(event)) {
    return { label: 'HIGH', variant: 'red' };
  }
  if (
    ['ROLE_PERMISSIONS_CHANGED', 'ROLE_DELETED', 'USER_ROLE_ASSIGNED', 'USER_ROLE_REMOVED'].includes(event)
  ) {
    return { label: 'MED', variant: 'amber' };
  }
  return { label: 'LOW', variant: 'default' };
};

/**
 * Live Security Audit Ledger (Dynanic RBAC.pdf §3.3): read-only,
 * append-only feed from GET /api/rbac/audit with the JSON before/after
 * snapshot vault in a context drawer and a regulatory CSV export.
 * Authentication events (auth_audit_log) join this feed once an endpoint
 * exposes them; per-session rows await a session-listing API — the
 * per-user kill switch lives in the User Directory drawer meanwhile.
 */
const AuditLedger: React.FC = () => {
  const [feed, setFeed] = React.useState<Feed>('config');
  const [pages, setPages] = React.useState(1);
  const [authPages, setAuthPages] = React.useState(1);
  const { data, isLoading } = useAudit(PAGE_SIZE * pages, 0);
  const { data: authData, isLoading: authLoading } = useAuthEvents(PAGE_SIZE * authPages, 0);
  const { data: sessionRows = [], isLoading: sessionsLoading } = useSessions();
  const revokeSessions = useRevokeSessions();
  const hasPermission = useHasPermission();
  // Name resolution needs the user directory — only fetch when permitted.
  const { data: users = [] } = useUsers(hasPermission('admin_users_view'));
  const canExport = hasPermission('admin_audit_export');
  const canTerminate = hasPermission('admin_sessions_terminate');

  const [selected, setSelected] = React.useState<AuditRow | null>(null);
  const [terminateMessage, setTerminateMessage] = React.useState<string | null>(null);

  const handleTerminate = async (personId: number, email: string) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Force terminate all active sessions for ${email}?`)) return;
    setTerminateMessage(null);
    try {
      const result = await revokeSessions.mutateAsync(personId);
      setTerminateMessage(`Terminated ${result.revokedSessions} session(s) for ${email}.`);
    } catch {
      setTerminateMessage(`Failed to terminate sessions for ${email}.`);
    }
  };

  const personLabel = (personId: number | null): string => {
    if (personId === null) return 'system';
    const user = users.find((u) => u.personId === personId);
    return user ? (user.name ?? user.email) : `person #${personId}`;
  };

  const rows = data?.rows ?? [];

  const exportCsv = () => {
    const header = 'timestamp,event,executed_by,target_type,target_id,ip_address\n';
    const body = rows
      .map((r) =>
        [
          r.createdAt,
          r.event,
          personLabel(r.executedByPersonId),
          r.targetType ?? '',
          r.targetId ?? '',
          r.ipAddress ?? '',
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rbac-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Security Audit Ledger</h1>
          <p className="text-sm text-muted-foreground">
            Append-only access-control changes, authentication events and live
            sessions
          </p>
        </div>
        {canExport && feed === 'config' && (
          <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Regulatory Export (CSV)
          </Button>
        )}
      </div>

      <div className="mb-3 flex gap-1 rounded-lg border bg-background p-1 text-sm w-fit">
        {(
          [
            ['config', `Configuration (${data?.total ?? '…'})`],
            ['auth', `Authentication (${authData?.total ?? '…'})`],
            ['sessions', `Active Sessions (${sessionRows.length})`],
          ] as [Feed, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFeed(key)}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              feed === key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {terminateMessage && (
        <p className="mb-2 text-sm text-emerald-700">{terminateMessage}</p>
      )}

      {feed === 'auth' && (
        <>
          <div className="rounded-lg border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Detail</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Risk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {authLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground">
                      Loading authentication events…
                    </TableCell>
                  </TableRow>
                )}
                {(authData?.rows ?? []).map((row) => {
                  const risk = authRiskOf(row.event, row.outcome);
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {new Date(row.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{row.event}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>
                        <Badge variant={row.outcome === 'SUCCESS' ? 'green' : 'red'}>
                          {row.outcome}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {row.detail ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.ipAddress ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={risk.variant}>{risk.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {authData && (authData.rows?.length ?? 0) < authData.total && (
            <div className="mt-3 flex justify-center">
              <Button variant="outline" onClick={() => setAuthPages((p) => p + 1)}>
                Load more ({authData.rows.length} of {authData.total})
              </Button>
            </div>
          )}
        </>
      )}

      {feed === 'sessions' && (
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Signed in</TableHead>
                <TableHead>Last used</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Device</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessionsLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    Loading sessions…
                  </TableCell>
                </TableRow>
              )}
              {!sessionsLoading && sessionRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    No active sessions.
                  </TableCell>
                </TableRow>
              )}
              {sessionRows.map((session) => (
                <TableRow key={session.tokenId}>
                  <TableCell>
                    <div className="font-medium">{session.name ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">{session.email}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {new Date(session.issuedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {new Date(session.lastUsedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {new Date(session.expiresAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {session.ipAddress ?? '—'}
                  </TableCell>
                  <TableCell className="max-w-[16rem] truncate text-xs text-muted-foreground">
                    {session.userAgent ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {canTerminate && (
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={revokeSessions.isPending}
                        onClick={() => handleTerminate(session.personId, session.email)}
                      >
                        Force Terminate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {feed === 'config' && (
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  Loading ledger…
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => {
              const risk = riskOf(row.event);
              return (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(row)}
                >
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {new Date(row.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{personLabel(row.executedByPersonId)}</TableCell>
                  <TableCell className="font-mono text-xs">{row.event}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.targetType ? `${row.targetType} #${row.targetId ?? '—'}` : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.ipAddress ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={risk.variant}>{risk.label}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      )}

      {feed === 'config' && data && rows.length < data.total && (
        <div className="mt-3 flex justify-center">
          <Button variant="outline" onClick={() => setPages((p) => p + 1)}>
            Load more ({rows.length} of {data.total})
          </Button>
        </div>
      )}

      {/* JSON Structural Schema Vault — before/after context drawer */}
      <Sheet
        open={selected !== null}
        onOpenChange={() => setSelected(null)}
        widthClassName="w-full max-w-lg"
      >
        {selected && (
          <div className="space-y-4">
            <div>
              <h2 className="font-mono text-base font-semibold">{selected.event}</h2>
              <p className="text-sm text-muted-foreground">
                {new Date(selected.createdAt).toLocaleString()} ·{' '}
                {personLabel(selected.executedByPersonId)}
                {selected.ipAddress ? ` · ${selected.ipAddress}` : ''}
              </p>
            </div>
            <div>
              <h3 className="mb-1 text-sm font-medium">Metadata payload (immutable)</h3>
              <pre className="max-h-[60vh] overflow-auto rounded-md border bg-slate-950 p-3 text-xs leading-5 text-slate-100">
                {JSON.stringify(selected.metadataPayload ?? {}, null, 2)}
              </pre>
            </div>
            {selected.userAgent && (
              <p className="break-all text-xs text-muted-foreground">
                {selected.userAgent}
              </p>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
};

export default AuditLedger;
