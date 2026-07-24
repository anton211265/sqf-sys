import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosClient from 'api/axiosClient';
import { Badge } from 'components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from 'components/ui/table';

/**
 * Empty-state screens for CRM nodes whose data source arrives with later
 * domains (approved annotation, decision 2). They hold their nav position
 * and gate keys so the manifest-driven navigation is already final.
 */
const boundary = (title: string, body: string) => {
  const Screen: React.FC = () => (
    <div className="p-6">
      <h1 className="mb-1 text-xl font-semibold">{title}</h1>
      <div className="mt-4 max-w-2xl rounded-lg border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
        {body}
      </div>
    </div>
  );
  return Screen;
};

export const MyApplicants = boundary(
  'My Applicants',
  'Activates with the Customer Portal intake: walk-in and RM-initiated applicants assigned to you will appear here with their onboarding progress, default risk score and the fail-status engagement SLA (10 working days, auto-close).',
);

/** Activated by Customer Portal pass 2: onboarded (registration-fee-paid)
 * clients, own-scope for RMs, team for supervisors. Portfolio metrics
 * (utilisation, DPD/DBT, dilution) arrive with Operations/Finance. */
export const MyClients: React.FC = () => {
  const { data: clients = [] } = useQuery({
    queryKey: ['crm', 'clients'],
    queryFn: async () =>
      (await axiosClient().get('/customer-relationship-management/api/crm/applicants-web/clients')).data,
  });
  return (
    <div className="p-6">
      <h1 className="mb-1 text-xl font-semibold">Client Management — Assigned</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Onboarded clients (registration fee received). Facility status is non-active
        until agreements are executed; portfolio metrics arrive with Operations/Finance.
      </p>
      <section className="rounded-lg border bg-background p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Filter-1</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Onboarded</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">No clients yet.</TableCell>
              </TableRow>
            )}
            {clients.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.companyName ?? `org #${c.organizationId}`}</TableCell>
                <TableCell className="font-mono text-xs">{c.productCode ?? '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {c.filter1Score ?? '—'} ({c.filter1Category ?? '—'} risk)
                </TableCell>
                <TableCell><Badge variant="blue">NON-ACTIVE CLIENT</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {c.clientOnboardedAt ? new Date(c.clientOnboardedAt).toLocaleDateString() : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
};
