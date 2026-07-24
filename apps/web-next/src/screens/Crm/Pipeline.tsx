import * as React from 'react';
import { ArrowUpRight, Plus } from 'lucide-react';

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
import {
  useCreateDeal,
  useCreateLead,
  useDeals,
  useLeads,
  usePromoteLead,
  useUpdateDeal,
  useUpdateLead,
} from 'hooks/useCrm';
import { useHasPermission } from 'hooks/useRbac';
import { DEAL_STAGES, DealStage, LeadRow } from 'types/CrmTypes';
import { getApiResponseErrorMsg } from 'utils/apiHelper';

const statusVariant = (status: string): 'default' | 'blue' | 'purple' | 'green' =>
  status === 'LEAD' ? 'default' : status === 'PROSPECT' ? 'blue' : status === 'PROMOTED' ? 'purple' : 'green';

const stageVariant = (stage: DealStage): 'blue' | 'amber' | 'purple' | 'green' | 'red' =>
  stage === 'QUALIFIED' ? 'blue' : stage === 'PROPOSAL' ? 'amber' : stage === 'NEGOTIATION' ? 'purple' : stage === 'WON' ? 'green' : 'red';

/**
 * My Pipeline (RM): leads funnel + deal kanban per the approved annotation.
 * Own rows only — supervisors use the team board on their dashboard. Stage
 * moves are per-card selects for now; drag-and-drop arrives with the
 * design/token pass.
 */
const Pipeline: React.FC = () => {
  const { data: leads = [], isLoading } = useLeads();
  const { data: deals = [] } = useDeals();
  const hasPermission = useHasPermission();
  const canLeads = hasPermission('crm_leads_manage');
  const canDeals = hasPermission('crm_deals_manage');
  const canPromote = hasPermission('crm_prospects_promote');

  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const promoteLead = usePromoteLead();
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();

  const [dialog, setDialog] = React.useState<'lead' | 'deal' | null>(null);
  const [dealLead, setDealLead] = React.useState<LeadRow | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [leadForm, setLeadForm] = React.useState({ companyName: '', contactName: '', contactEmail: '', source: '' });
  const [dealForm, setDealForm] = React.useState({ title: '', productCode: '', dealValue: '', expectedCloseDate: '' });

  const act = async (fn: () => Promise<unknown>, success?: string) => {
    setError(null);
    setNotice(null);
    try {
      await fn();
      if (success) setNotice(success);
      return true;
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
      return false;
    }
  };

  const submitLead = () =>
    act(async () => {
      await createLead.mutateAsync({
        companyName: leadForm.companyName.trim(),
        contactName: leadForm.contactName.trim() || undefined,
        contactEmail: leadForm.contactEmail.trim() || undefined,
        source: leadForm.source.trim() || undefined,
      });
      setDialog(null);
    });

  const submitDeal = () =>
    act(async () => {
      if (!dealLead) return;
      await createDeal.mutateAsync({
        leadId: dealLead.id,
        title: dealForm.title.trim(),
        productCode: dealForm.productCode.trim() || undefined,
        dealValue: dealForm.dealValue.trim() ? parseFloat(dealForm.dealValue) : undefined,
        expectedCloseDate: dealForm.expectedCloseDate || undefined,
      });
      setDialog(null);
    });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">My Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Leads → prospects → deals; promotion hands a prospect to onboarding
          </p>
        </div>
        {canLeads && (
          <Button onClick={() => { setError(null); setLeadForm({ companyName: '', contactName: '', contactEmail: '', source: '' }); setDialog('lead'); }}>
            <Plus className="mr-2 h-4 w-4" /> New Lead
          </Button>
        )}
      </div>
      {(error || notice) && (
        <div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {notice && <p className="text-sm text-emerald-700">{notice}</p>}
        </div>
      )}

      {/* Leads funnel */}
      <section className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={5} className="text-muted-foreground">Loading leads…</TableCell></TableRow>
            )}
            {!isLoading && leads.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-muted-foreground">No leads yet.</TableCell></TableRow>
            )}
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <div className="font-medium">{lead.companyName}</div>
                  {lead.registrationNumber && (
                    <div className="text-xs text-muted-foreground">{lead.registrationNumber}</div>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {lead.contactName ?? '—'}
                  {lead.contactEmail && <div className="text-xs">{lead.contactEmail}</div>}
                </TableCell>
                <TableCell className="text-muted-foreground">{lead.source ?? '—'}</TableCell>
                <TableCell><Badge variant={statusVariant(lead.status)}>{lead.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {canLeads && lead.status === 'LEAD' && (
                      <Button size="sm" variant="outline" onClick={() => act(() => updateLead.mutateAsync({ id: lead.id, status: 'PROSPECT' }), `${lead.companyName} qualified as prospect.`)}>
                        Qualify
                      </Button>
                    )}
                    {canDeals && (lead.status === 'PROSPECT' || lead.status === 'LEAD') && (
                      <Button size="sm" variant="outline" onClick={() => { setError(null); setDealLead(lead); setDealForm({ title: `${lead.companyName} facility`, productCode: '', dealValue: '', expectedCloseDate: '' }); setDialog('deal'); }}>
                        + Deal
                      </Button>
                    )}
                    {canPromote && lead.status === 'PROSPECT' && (
                      <Button size="sm" onClick={() => act(() => promoteLead.mutateAsync(lead.id), `${lead.companyName} promoted — onboarding invite sent, SLA timer started.`)}>
                        <ArrowUpRight className="mr-1 h-3.5 w-3.5" /> Promote
                      </Button>
                    )}
                    {canLeads && lead.status !== 'PROMOTED' && lead.status !== 'CLOSED' && (
                      <Button size="sm" variant="outline" onClick={() => act(() => updateLead.mutateAsync({ id: lead.id, status: 'CLOSED' }))}>
                        Close
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* Kanban */}
      <section>
        <h2 className="mb-2 font-medium">Deal Board</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {DEAL_STAGES.map((stage) => (
            <div key={stage} className="rounded-lg border bg-muted/30 p-2">
              <div className="mb-2 flex items-center justify-between px-1">
                <Badge variant={stageVariant(stage)}>{stage}</Badge>
                <span className="text-xs text-muted-foreground">
                  {deals.filter((d) => d.stage === stage).length}
                </span>
              </div>
              <div className="space-y-2">
                {deals
                  .filter((deal) => deal.stage === stage)
                  .map((deal) => (
                    <div key={deal.id} className="rounded-md border bg-background p-2 text-sm">
                      <div className="font-medium">{deal.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {deal.lead?.companyName}
                        {deal.dealValue && ` · ${parseFloat(deal.dealValue).toLocaleString()}`}
                        {deal.productCode && ` · ${deal.productCode}`}
                      </div>
                      {canDeals && !deal.closedAt && (
                        <select
                          aria-label={`stage-${deal.id}`}
                          className="mt-2 h-7 w-full rounded-md border border-input bg-background px-1 text-xs"
                          value={deal.stage}
                          onChange={(e) => act(() => updateDeal.mutateAsync({ id: deal.id, stage: e.target.value as DealStage }))}
                        >
                          {DEAL_STAGES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dialogs */}
      <Dialog open={dialog === 'lead'} onOpenChange={() => setDialog(null)}>
        <DialogTitle>New Lead</DialogTitle>
        <DialogDescription>Unqualified prospect — qualify it once vetted.</DialogDescription>
        <div className="space-y-3">
          <div>
            <Label htmlFor="lead-company">Company name</Label>
            <Input id="lead-company" value={leadForm.companyName} onChange={(e) => setLeadForm({ ...leadForm, companyName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="lead-contact">Contact name</Label>
              <Input id="lead-contact" value={leadForm.contactName} onChange={(e) => setLeadForm({ ...leadForm, contactName: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="lead-email">Contact email</Label>
              <Input id="lead-email" value={leadForm.contactEmail} onChange={(e) => setLeadForm({ ...leadForm, contactEmail: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="lead-source">Source (optional)</Label>
            <Input id="lead-source" value={leadForm.source} onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
          <Button disabled={!leadForm.companyName.trim() || createLead.isPending} onClick={submitLead}>Create Lead</Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={dialog === 'deal'} onOpenChange={() => setDialog(null)}>
        <DialogTitle>New Deal — {dealLead?.companyName}</DialogTitle>
        <DialogDescription>Starts at QUALIFIED on the board.</DialogDescription>
        <div className="space-y-3">
          <div>
            <Label htmlFor="deal-title">Title</Label>
            <Input id="deal-title" value={dealForm.title} onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="deal-product">Product</Label>
              <Input id="deal-product" placeholder="e.g. IF" value={dealForm.productCode} onChange={(e) => setDealForm({ ...dealForm, productCode: e.target.value.toUpperCase() })} />
            </div>
            <div>
              <Label htmlFor="deal-value">Value</Label>
              <Input id="deal-value" placeholder="e.g. 250000" value={dealForm.dealValue} onChange={(e) => setDealForm({ ...dealForm, dealValue: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="deal-close">Expected close</Label>
              <Input id="deal-close" type="date" value={dealForm.expectedCloseDate} onChange={(e) => setDealForm({ ...dealForm, expectedCloseDate: e.target.value })} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
          <Button disabled={!dealForm.title.trim() || createDeal.isPending} onClick={submitDeal}>Create Deal</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default Pipeline;
