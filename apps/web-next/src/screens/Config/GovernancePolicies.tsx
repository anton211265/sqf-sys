import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';

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
  useDeleteApprovalRule,
  useDeleteCreditRange,
  useDeleteSla,
  usePatchPolicySettings,
  usePolicies,
  useResolveSlaTimer,
  useSlaTimers,
  useUpsertApprovalRule,
  useUpsertCreditRange,
  useUpsertSla,
} from 'hooks/useConfigurator';
import { useHasPermission } from 'hooks/useRbac';
import { getApiResponseErrorMsg } from 'utils/apiHelper';

const selectClass =
  'h-9 w-full rounded-md border border-input bg-background px-3 text-sm';

/**
 * Governance Policies (wireframe 9): SLA timer templates, executive
 * approval matrix, credit-limit assignment ranges and operational policy
 * toggles. One view gate (config_policies_view); each section's edit
 * controls carry their own key and are absent without it.
 */
const GovernancePolicies: React.FC = () => {
  const { data, isLoading } = usePolicies();
  const hasPermission = useHasPermission();
  const canSla = hasPermission('config_sla_manage');
  const canMatrix = hasPermission('config_approval_matrix_manage');
  const canRanges = hasPermission('config_credit_ranges_manage');
  const canPolicies = hasPermission('config_policies_manage');

  const upsertSla = useUpsertSla();
  const deleteSla = useDeleteSla();
  const { data: timers = [] } = useSlaTimers();
  const resolveTimer = useResolveSlaTimer();
  const upsertRule = useUpsertApprovalRule();
  const deleteRule = useDeleteApprovalRule();
  const upsertRange = useUpsertCreditRange();
  const deleteRange = useDeleteCreditRange();
  const patchSettings = usePatchPolicySettings();

  const [dialog, setDialog] = React.useState<'sla' | 'rule' | 'range' | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const [slaForm, setSlaForm] = React.useState({ code: '', name: '', value: '', unit: 'WORKING_DAYS', action: '' });
  const [ruleForm, setRuleForm] = React.useState({ scope: '', threshold: '', approvals: '1', mode: 'SEQUENTIAL', description: '' });
  const [rangeForm, setRangeForm] = React.useState({ productCode: '', band: 'LOW', min: '', max: '' });
  const [bankMode, setBankMode] = React.useState('');
  const [emailMode, setEmailMode] = React.useState('');

  React.useEffect(() => {
    if (data?.settings) {
      setBankMode(data.settings.bankCountryMatchMode);
      setEmailMode(data.settings.corporateEmailMode);
    }
  }, [data?.settings]);

  const submit = async () => {
    setError(null);
    try {
      if (dialog === 'sla') {
        await upsertSla.mutateAsync({
          slaCode: slaForm.code.trim().toUpperCase().replace(/\s+/g, '_'),
          slaName: slaForm.name.trim(),
          windowValue: parseInt(slaForm.value, 10),
          windowUnit: slaForm.unit,
          breachAction: slaForm.action.trim(),
        });
      } else if (dialog === 'rule') {
        await upsertRule.mutateAsync({
          scope: ruleForm.scope.trim().toUpperCase().replace(/\s+/g, '_'),
          thresholdAmount: ruleForm.threshold.trim() ? parseFloat(ruleForm.threshold) : undefined,
          requiredApprovals: parseInt(ruleForm.approvals, 10),
          mode: ruleForm.mode,
          description: ruleForm.description.trim() || undefined,
        });
      } else if (dialog === 'range') {
        await upsertRange.mutateAsync({
          productCode: rangeForm.productCode.trim().toUpperCase(),
          riskBand: rangeForm.band,
          minLimit: parseFloat(rangeForm.min),
          maxLimit: parseFloat(rangeForm.max),
        });
      }
      setDialog(null);
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    }
  };

  const savePolicySettings = async () => {
    setError(null);
    setNotice(null);
    try {
      await patchSettings.mutateAsync({
        bankCountryMatchMode: bankMode,
        corporateEmailMode: emailMode,
      });
      setNotice('Operational policies saved.');
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Governance Policies</h1>
        <p className="text-sm text-muted-foreground">
          SLA timers, executive approval matrix, credit-limit ranges and
          operational policies
        </p>
      </div>
      {(error || notice) && (
        <div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {notice && <p className="text-sm text-emerald-700">{notice}</p>}
        </div>
      )}

      {/* SLA templates */}
      <section className="rounded-lg border bg-background p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">SLA Timer Templates</h2>
          {canSla && (
            <Button variant="outline" size="sm" onClick={() => { setError(null); setSlaForm({ code: '', name: '', value: '', unit: 'WORKING_DAYS', action: '' }); setDialog('sla'); }}>
              <Plus className="mr-2 h-3.5 w-3.5" /> SLA Timer
            </Button>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Timer</TableHead>
              <TableHead>Window</TableHead>
              <TableHead>On breach</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.slas ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  {isLoading ? 'Loading…' : 'No SLA timers configured — every process SLA belongs here, not in a hardcoded cron.'}
                </TableCell>
              </TableRow>
            )}
            {(data?.slas ?? []).map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono">{row.slaCode}</TableCell>
                <TableCell>{row.slaName}</TableCell>
                <TableCell>
                  {row.windowValue}{' '}
                  {row.windowUnit === 'WORKING_DAYS' ? 'wd' : row.windowUnit.toLowerCase()}
                </TableCell>
                <TableCell className="text-muted-foreground">{row.breachAction}</TableCell>
                <TableCell className="text-right">
                  {canSla && (
                    <button type="button" aria-label={`Delete ${row.slaCode}`} onClick={() => deleteSla.mutate(row.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* SLA timer monitor (runtime state, refreshes every 15s) */}
      <section className="rounded-lg border bg-background p-4">
        <h2 className="mb-3 font-medium">SLA Timer Monitor</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SLA</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notify</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {timers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  No timers yet — business flows start them via Kafka
                  (SLA_TIMER_START); breaches fire every 30 seconds.
                </TableCell>
              </TableRow>
            )}
            {timers.map((timer) => (
              <TableRow key={timer.id}>
                <TableCell className="font-mono text-xs">{timer.slaCode}</TableCell>
                <TableCell>
                  {timer.subjectType} #{timer.subjectId}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {new Date(timer.deadlineAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      timer.status === 'BREACHED'
                        ? 'red'
                        : timer.status === 'RUNNING'
                          ? 'blue'
                          : 'green'
                    }
                  >
                    {timer.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {timer.notifyEmail ?? '—'}
                </TableCell>
                <TableCell className="text-right">
                  {canSla && timer.status === 'RUNNING' && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={resolveTimer.isPending}
                      onClick={() =>
                        resolveTimer.mutate({ id: timer.id, reason: 'resolved from portal' })
                      }
                    >
                      Resolve
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* Approval matrix */}
      <section className="rounded-lg border bg-background p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">Executive Approval Matrix</h2>
          {canMatrix && (
            <Button variant="outline" size="sm" onClick={() => { setError(null); setRuleForm({ scope: '', threshold: '', approvals: '1', mode: 'SEQUENTIAL', description: '' }); setDialog('rule'); }}>
              <Plus className="mr-2 h-3.5 w-3.5" /> Rule
            </Button>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Scope</TableHead>
              <TableHead>Threshold</TableHead>
              <TableHead>Approvals</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Description</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.approvalRules ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  {isLoading ? 'Loading…' : 'No approval rules — the Product Fulfillment executive gate reads these.'}
                </TableCell>
              </TableRow>
            )}
            {(data?.approvalRules ?? []).map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono">{row.scope}</TableCell>
                <TableCell>
                  {row.thresholdAmount === null ? (
                    <Badge variant="outline">default</Badge>
                  ) : (
                    `≥ ${parseFloat(row.thresholdAmount).toLocaleString()}`
                  )}
                </TableCell>
                <TableCell>{row.requiredApprovals}</TableCell>
                <TableCell className="text-muted-foreground">{row.mode}</TableCell>
                <TableCell className="text-muted-foreground">{row.description ?? '—'}</TableCell>
                <TableCell className="text-right">
                  {canMatrix && (
                    <button type="button" aria-label={`Delete rule ${row.id}`} onClick={() => deleteRule.mutate(row.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* Credit-limit ranges */}
      <section className="rounded-lg border bg-background p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">Credit Limit Assignment Ranges</h2>
          {canRanges && (
            <Button variant="outline" size="sm" onClick={() => { setError(null); setRangeForm({ productCode: '', band: 'LOW', min: '', max: '' }); setDialog('range'); }}>
              <Plus className="mr-2 h-3.5 w-3.5" /> Range
            </Button>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Risk band</TableHead>
              <TableHead>Min limit</TableHead>
              <TableHead>Max limit</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.creditRanges ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  {isLoading ? 'Loading…' : 'No ranges — CRC credit-limit assignment reads these.'}
                </TableCell>
              </TableRow>
            )}
            {(data?.creditRanges ?? []).map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono">{row.productCode}</TableCell>
                <TableCell>
                  <Badge variant={row.riskBand === 'LOW' ? 'green' : row.riskBand === 'MEDIUM' ? 'amber' : 'red'}>
                    {row.riskBand} RISK
                  </Badge>
                </TableCell>
                <TableCell>{parseFloat(row.minLimit).toLocaleString()}</TableCell>
                <TableCell>{parseFloat(row.maxLimit).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  {canRanges && (
                    <button type="button" aria-label={`Delete range ${row.id}`} onClick={() => deleteRange.mutate(row.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* Operational policies */}
      <section className="rounded-lg border bg-background p-4">
        <h2 className="mb-3 font-medium">Operational Policies</h2>
        <div className="grid max-w-2xl grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pol-bank">Bank-country match</Label>
            <select id="pol-bank" className={selectClass} value={bankMode} disabled={!canPolicies} onChange={(e) => setBankMode(e.target.value)}>
              <option value="HARD_BLOCK">Hard block (override needs compliance approval)</option>
              <option value="FLAG_ONLY">Flag for review only</option>
            </select>
          </div>
          <div>
            <Label htmlFor="pol-email">Corporate-email rule</Label>
            <select id="pol-email" className={selectClass} value={emailMode} disabled={!canPolicies} onChange={(e) => setEmailMode(e.target.value)}>
              <option value="BLOCK">Block free/disposable domains</option>
              <option value="FLAG_ONLY">Flag for RM review</option>
            </select>
          </div>
        </div>
        {canPolicies && (
          <div className="mt-3">
            <Button size="sm" onClick={savePolicySettings} disabled={patchSettings.isPending}>
              Save Policies
            </Button>
          </div>
        )}
      </section>

      {/* Dialogs */}
      <Dialog open={dialog === 'sla'} onOpenChange={() => setDialog(null)}>
        <DialogTitle>SLA Timer Template</DialogTitle>
        <DialogDescription>Same code upserts in place.</DialogDescription>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sla-code">Code (e.g. PROVISIONAL_OFFER)</Label>
              <Input id="sla-code" value={slaForm.code} onChange={(e) => setSlaForm({ ...slaForm, code: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="sla-name">Timer name</Label>
              <Input id="sla-name" value={slaForm.name} onChange={(e) => setSlaForm({ ...slaForm, name: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sla-value">Window</Label>
              <Input id="sla-value" value={slaForm.value} onChange={(e) => setSlaForm({ ...slaForm, value: e.target.value })} placeholder="e.g. 2" />
            </div>
            <div>
              <Label htmlFor="sla-unit">Unit</Label>
              <select id="sla-unit" className={selectClass} value={slaForm.unit} onChange={(e) => setSlaForm({ ...slaForm, unit: e.target.value })}>
                <option value="HOURS">Hours</option>
                <option value="DAYS">Days</option>
                <option value="WORKING_DAYS">Working days</option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="sla-action">On breach (e.g. NOTIFY_RM_SUPERVISOR)</Label>
            <Input id="sla-action" value={slaForm.action} onChange={(e) => setSlaForm({ ...slaForm, action: e.target.value })} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
          <Button disabled={!slaForm.code.trim() || !slaForm.name.trim() || !slaForm.value.trim() || !slaForm.action.trim() || upsertSla.isPending} onClick={submit}>
            Save SLA
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={dialog === 'rule'} onOpenChange={() => setDialog(null)}>
        <DialogTitle>Approval Matrix Rule</DialogTitle>
        <DialogDescription>
          No threshold = the scope's default rule; with a threshold the rule
          applies to amounts at or above it (most-specific wins).
        </DialogDescription>
        <div className="space-y-3">
          <div>
            <Label htmlFor="rule-scope">Scope (e.g. OFFER_LETTER, DISBURSEMENT)</Label>
            <Input id="rule-scope" value={ruleForm.scope} onChange={(e) => setRuleForm({ ...ruleForm, scope: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="rule-threshold">Threshold (optional)</Label>
              <Input id="rule-threshold" value={ruleForm.threshold} onChange={(e) => setRuleForm({ ...ruleForm, threshold: e.target.value })} placeholder="e.g. 500000" />
            </div>
            <div>
              <Label htmlFor="rule-approvals">Approvals</Label>
              <Input id="rule-approvals" value={ruleForm.approvals} onChange={(e) => setRuleForm({ ...ruleForm, approvals: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="rule-mode">Mode</Label>
              <select id="rule-mode" className={selectClass} value={ruleForm.mode} onChange={(e) => setRuleForm({ ...ruleForm, mode: e.target.value })}>
                <option value="SEQUENTIAL">Sequential</option>
                <option value="PARALLEL">Parallel</option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="rule-desc">Description (optional)</Label>
            <Input id="rule-desc" value={ruleForm.description} onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
          <Button disabled={!ruleForm.scope.trim() || !ruleForm.approvals.trim() || upsertRule.isPending} onClick={submit}>
            Save Rule
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={dialog === 'range'} onOpenChange={() => setDialog(null)}>
        <DialogTitle>Credit Limit Range</DialogTitle>
        <DialogDescription>
          Band labels name the RISK (Low risk = score 71–100). Same product +
          band upserts in place.
        </DialogDescription>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="range-product">Product code</Label>
              <Input id="range-product" value={rangeForm.productCode} onChange={(e) => setRangeForm({ ...rangeForm, productCode: e.target.value })} placeholder="e.g. IF" />
            </div>
            <div>
              <Label htmlFor="range-band">Risk band</Label>
              <select id="range-band" className={selectClass} value={rangeForm.band} onChange={(e) => setRangeForm({ ...rangeForm, band: e.target.value })}>
                <option value="LOW">Low risk</option>
                <option value="MEDIUM">Medium risk</option>
                <option value="HIGH">High risk</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="range-min">Min limit</Label>
              <Input id="range-min" value={rangeForm.min} onChange={(e) => setRangeForm({ ...rangeForm, min: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="range-max">Max limit</Label>
              <Input id="range-max" value={rangeForm.max} onChange={(e) => setRangeForm({ ...rangeForm, max: e.target.value })} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
          <Button disabled={!rangeForm.productCode.trim() || !rangeForm.min.trim() || !rangeForm.max.trim() || upsertRange.isPending} onClick={submit}>
            Save Range
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default GovernancePolicies;
