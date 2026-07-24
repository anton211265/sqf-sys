import * as React from 'react';
import { Plus } from 'lucide-react';

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
import { useCreateSiteVisit, useLeads, useSiteVisits } from 'hooks/useCrm';
import { useHasPermission } from 'hooks/useRbac';
import { getApiResponseErrorMsg } from 'utils/apiHelper';

/** RM assessment records (blueprint: RM Dashboard → Assessment). */
const SiteVisits: React.FC = () => {
  const hasPermission = useHasPermission();
  const supervisor = hasPermission('crm_supervisor_view');
  const { data: visits = [], isLoading } = useSiteVisits(supervisor ? 'team' : undefined);
  const { data: leads = [] } = useLeads();
  const canManage = hasPermission('onboarding_site_visits_manage');
  const createVisit = useCreateSiteVisit();

  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ leadId: '', visitedAt: '', summary: '', findings: '' });

  const submit = async () => {
    setError(null);
    try {
      await createVisit.mutateAsync({
        leadId: form.leadId ? parseInt(form.leadId, 10) : undefined,
        visitedAt: form.visitedAt,
        summary: form.summary.trim(),
        findings: form.findings.trim() || undefined,
      });
      setOpen(false);
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    }
  };

  const leadName = (leadId: number | null) =>
    leadId === null ? '—' : leads.find((l) => l.id === leadId)?.companyName ?? `lead #${leadId}`;

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Site Visit Reports</h1>
          <p className="text-sm text-muted-foreground">
            {supervisor ? 'Team assessments' : 'Your assessment records'}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => { setError(null); setForm({ leadId: '', visitedAt: '', summary: '', findings: '' }); setOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> New Report
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Visited</TableHead>
              <TableHead>Lead / company</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Findings</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={4} className="text-muted-foreground">Loading reports…</TableCell></TableRow>
            )}
            {!isLoading && visits.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-muted-foreground">No site visits recorded.</TableCell></TableRow>
            )}
            {visits.map((visit) => (
              <TableRow key={visit.id}>
                <TableCell className="whitespace-nowrap">{visit.visitedAt}</TableCell>
                <TableCell>{leadName(visit.leadId)}</TableCell>
                <TableCell>{visit.summary}</TableCell>
                <TableCell className="max-w-md text-muted-foreground">{visit.findings ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTitle>New Site Visit Report</DialogTitle>
        <DialogDescription>Assessment evidence for the funnel and CRC review.</DialogDescription>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="visit-lead">Lead (optional)</Label>
              <select
                id="visit-lead"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.leadId}
                onChange={(e) => setForm({ ...form, leadId: e.target.value })}
              >
                <option value="">(none)</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>{lead.companyName}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="visit-date">Visit date</Label>
              <Input id="visit-date" type="date" value={form.visitedAt} onChange={(e) => setForm({ ...form, visitedAt: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="visit-summary">Summary</Label>
            <Input id="visit-summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="visit-findings">Findings (optional)</Label>
            <textarea
              id="visit-findings"
              rows={4}
              className="w-full rounded-md border border-input bg-background p-3 text-sm"
              value={form.findings}
              onChange={(e) => setForm({ ...form, findings: e.target.value })}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={!form.visitedAt || !form.summary.trim() || createVisit.isPending} onClick={submit}>
            Save Report
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default SiteVisits;
