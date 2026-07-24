import * as React from 'react';

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
import { useAssignLead, useDeals, useLeads, usePerformance } from 'hooks/useCrm';
import { useHasPermission, useUsers } from 'hooks/useRbac';
import { LeadRow } from 'types/CrmTypes';
import { getApiResponseErrorMsg } from 'utils/apiHelper';

/**
 * Supervisor Dashboard: per-RM funnel performance, the team pipeline and
 * lead assignment (crm_assignees_manage). The "new applicants (web)" queue
 * activates with the Customer Portal intake — labelled placeholder per the
 * approved phase boundary.
 */
const SupervisorDashboard: React.FC = () => {
  const hasPermission = useHasPermission();
  const { data: performance = [] } = usePerformance(true);
  const { data: teamLeads = [] } = useLeads('team');
  const { data: teamDeals = [] } = useDeals('team');
  const canAssign = hasPermission('crm_assignees_manage');
  // Name resolution for RM ids when the caller may also view the directory
  const { data: users = [] } = useUsers(hasPermission('admin_users_view'));

  const assignLead = useAssignLead();
  const [assigning, setAssigning] = React.useState<LeadRow | null>(null);
  const [rmInput, setRmInput] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const personLabel = (personId: number) => {
    const user = users.find((u) => u.personId === personId);
    return user ? (user.name ?? user.email) : `person #${personId}`;
  };

  const submitAssign = async () => {
    if (!assigning) return;
    setError(null);
    try {
      await assignLead.mutateAsync({ id: assigning.id, rmPersonId: parseInt(rmInput, 10) });
      setAssigning(null);
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    }
  };

  const openDeals = teamDeals.filter((d) => !d.closedAt);
  const pipelineValue = openDeals.reduce(
    (sum, d) => sum + (d.dealValue ? parseFloat(d.dealValue) : 0),
    0,
  );

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Supervisor Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Team funnel, RM performance and assignment
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Team leads', teamLeads.length],
          ['Open deals', openDeals.length],
          ['Pipeline value', pipelineValue.toLocaleString()],
          ['Won deals', teamDeals.filter((d) => d.stage === 'WON').length],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-lg border bg-background p-4">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-2xl font-semibold">{value}</div>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
        <strong>New applicants (web intake):</strong> this queue activates when
        the Customer Portal onboarding lands — walk-in applicants will appear
        here with their default risk score for assignment to an RM.
      </section>

      <section className="rounded-lg border bg-background p-4">
        <h2 className="mb-3 font-medium">RM Performance</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RM</TableHead>
              <TableHead>Leads</TableHead>
              <TableHead>Prospects</TableHead>
              <TableHead>Promoted</TableHead>
              <TableHead>Open deals</TableHead>
              <TableHead>Won / Lost</TableHead>
              <TableHead>Pipeline value</TableHead>
              <TableHead>Qualification</TableHead>
              <TableHead>Win rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {performance.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-muted-foreground">
                  No RM activity yet.
                </TableCell>
              </TableRow>
            )}
            {performance.map((row) => (
              <TableRow key={row.rmPersonId}>
                <TableCell className="font-medium">{personLabel(row.rmPersonId)}</TableCell>
                <TableCell>{row.leads}</TableCell>
                <TableCell>{row.prospects}</TableCell>
                <TableCell>{row.promoted}</TableCell>
                <TableCell>{row.dealsOpen}</TableCell>
                <TableCell>{row.dealsWon} / {row.dealsLost}</TableCell>
                <TableCell>{row.pipelineValue.toLocaleString()}</TableCell>
                <TableCell>{(row.qualificationRate * 100).toFixed(0)}%</TableCell>
                <TableCell>{(row.winRate * 100).toFixed(0)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="rounded-lg border bg-background p-4">
        <h2 className="mb-3 font-medium">Team Leads</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamLeads.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">No leads yet.</TableCell>
              </TableRow>
            )}
            {teamLeads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.companyName}</TableCell>
                <TableCell>
                  <Badge variant={lead.status === 'PROSPECT' ? 'blue' : lead.status === 'PROMOTED' ? 'purple' : 'default'}>
                    {lead.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{personLabel(lead.ownerRmPersonId)}</TableCell>
                <TableCell className="text-right">
                  {canAssign && lead.status !== 'PROMOTED' && (
                    <Button size="sm" variant="outline" onClick={() => { setError(null); setRmInput(''); setAssigning(lead); }}>
                      Reassign
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <Dialog open={assigning !== null} onOpenChange={() => setAssigning(null)}>
        <DialogTitle>Assign {assigning?.companyName}</DialogTitle>
        <DialogDescription>
          The lead moves to the chosen RM's pipeline immediately.
        </DialogDescription>
        <div className="space-y-3">
          {users.length > 0 ? (
            <div>
              <Label htmlFor="assign-rm">Relationship Manager</Label>
              <select
                id="assign-rm"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={rmInput}
                onChange={(e) => setRmInput(e.target.value)}
              >
                <option value="">Select…</option>
                {users.map((u) => (
                  <option key={u.personId} value={u.personId}>
                    {u.name ?? u.email}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <Label htmlFor="assign-rm-id">RM person id (see User Directory)</Label>
              <Input id="assign-rm-id" type="number" value={rmInput} onChange={(e) => setRmInput(e.target.value)} />
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAssigning(null)}>Cancel</Button>
          <Button disabled={!rmInput || assignLead.isPending} onClick={submitAssign}>Assign</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default SupervisorDashboard;
