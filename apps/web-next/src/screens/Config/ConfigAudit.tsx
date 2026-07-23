import * as React from 'react';

import { Badge } from 'components/ui/badge';
import { Sheet } from 'components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'components/ui/table';
import { useConfigAudit } from 'hooks/useConfigurator';
import { ConfigAuditRow } from 'types/ConfiguratorTypes';

const actionVariant = (action: string): 'green' | 'amber' | 'blue' | 'default' => {
  if (action === 'PUBLISH') return 'green';
  if (action === 'ARCHIVE' || action === 'OVERRIDE') return 'amber';
  if (action === 'CREATE' || action === 'BIND') return 'blue';
  return 'default';
};

/** Product configuration audit trail (same-transaction, append-only). */
const ConfigAudit: React.FC = () => {
  const { data, isLoading } = useConfigAudit(200);
  const [selected, setSelected] = React.useState<ConfigAuditRow | null>(null);

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Configuration Audit</h1>
        <p className="text-sm text-muted-foreground">
          Every product/rate-card/template/assignment change, with before &
          after values ({data?.total ?? '…'} entries)
        </p>
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  Loading audit trail…
                </TableCell>
              </TableRow>
            )}
            {(data?.rows ?? []).map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() => setSelected(row)}
              >
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {new Date(row.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <span className="mr-1">{`person #${row.actorIdentifier}`}</span>
                  {row.actorType === 'AI_AGENT' && <Badge variant="purple">AI</Badge>}
                </TableCell>
                <TableCell>
                  <Badge variant={actionVariant(row.actionPerformed)}>
                    {row.actionPerformed}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {row.targetTable} #{row.entityId}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.changeReason ?? '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet
        open={selected !== null}
        onOpenChange={() => setSelected(null)}
        widthClassName="w-full max-w-lg"
      >
        {selected && (
          <div className="space-y-4">
            <div>
              <h2 className="font-mono text-base font-semibold">
                {selected.actionPerformed} · {selected.targetTable} #{selected.entityId}
              </h2>
              <p className="text-sm text-muted-foreground">
                {new Date(selected.createdAt).toLocaleString()} · person #
                {selected.actorIdentifier} ({selected.actorType})
              </p>
            </div>
            <div>
              <h3 className="mb-1 text-sm font-medium">Old values</h3>
              <pre className="max-h-48 overflow-auto rounded-md border bg-slate-950 p-3 text-xs leading-5 text-slate-100">
                {JSON.stringify(selected.oldValues ?? null, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="mb-1 text-sm font-medium">New values</h3>
              <pre className="max-h-48 overflow-auto rounded-md border bg-slate-950 p-3 text-xs leading-5 text-slate-100">
                {JSON.stringify(selected.newValues, null, 2)}
              </pre>
            </div>
            {selected.changeReason && (
              <p className="text-sm text-muted-foreground">
                Reason: {selected.changeReason}
              </p>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
};

export default ConfigAudit;
