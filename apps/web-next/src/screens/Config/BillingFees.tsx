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
  useBilling,
  useDeleteFee,
  useDeleteRateIndex,
  usePatchBillingSettings,
  useUpsertFee,
  useUpsertRateIndex,
} from 'hooks/useConfigurator';
import { useHasPermission } from 'hooks/useRbac';
import { fractionToPercent, percentToFraction } from 'types/ConfiguratorTypes';
import { getApiResponseErrorMsg } from 'utils/apiHelper';

/**
 * Billing & Fee Execution Engine (wireframe 8, top half): base rate
 * indices, service charge matrix, penalty margin and day-count presets.
 * Edits gate on config_billing_manage; controls are absent without it.
 */
const BillingFees: React.FC = () => {
  const { data, isLoading } = useBilling();
  const hasPermission = useHasPermission();
  const canManage = hasPermission('config_billing_manage');

  const upsertIndex = useUpsertRateIndex();
  const deleteIndex = useDeleteRateIndex();
  const upsertFee = useUpsertFee();
  const deleteFee = useDeleteFee();
  const patchSettings = usePatchBillingSettings();

  const [dialog, setDialog] = React.useState<'index' | 'fee' | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const [indexCode, setIndexCode] = React.useState('');
  const [indexRate, setIndexRate] = React.useState('');
  const [indexMode, setIndexMode] = React.useState('MANUAL');

  const [feeCode, setFeeCode] = React.useState('');
  const [feeName, setFeeName] = React.useState('');
  const [feeAmount, setFeeAmount] = React.useState('');
  const [feeBasis, setFeeBasis] = React.useState('TRANSACTION');
  const [feeDeduction, setFeeDeduction] = React.useState('AT_DISBURSEMENT');

  const [dayCount, setDayCount] = React.useState('');
  const [penaltyPct, setPenaltyPct] = React.useState('');

  React.useEffect(() => {
    if (data?.settings) {
      setDayCount(data.settings.dayCountConvention);
      setPenaltyPct(String(parseFloat(data.settings.penaltyMarginPct) * 100));
    }
  }, [data?.settings]);

  const submitIndex = async () => {
    setError(null);
    try {
      await upsertIndex.mutateAsync({
        indexCode: indexCode.trim().toUpperCase(),
        ratePct: percentToFraction(parseFloat(indexRate)),
        updateMode: indexMode as 'MANUAL' | 'API',
      });
      setDialog(null);
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    }
  };

  const submitFee = async () => {
    setError(null);
    try {
      await upsertFee.mutateAsync({
        feeCode: feeCode.trim().toUpperCase().replace(/\s+/g, '_'),
        feeName: feeName.trim(),
        amount: parseFloat(feeAmount),
        chargeBasis: feeBasis,
        deductionRule: feeDeduction,
      });
      setDialog(null);
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    }
  };

  const saveSettings = async () => {
    setError(null);
    setNotice(null);
    try {
      await patchSettings.mutateAsync({
        dayCountConvention: dayCount,
        penaltyMarginPct: percentToFraction(parseFloat(penaltyPct || '0')),
      });
      setNotice('Billing settings saved.');
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    }
  };

  const selectClass =
    'h-9 w-full rounded-md border border-input bg-background px-3 text-sm';

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Billing & Fee Engine</h1>
        <p className="text-sm text-muted-foreground">
          Base rate indices, service charges, penalty margin and day-count
          conventions
        </p>
      </div>
      {(error || notice) && (
        <div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {notice && <p className="text-sm text-emerald-700">{notice}</p>}
        </div>
      )}

      <section className="rounded-lg border bg-background p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">Interest & Accrual Matrix</h2>
          {canManage && (
            <Button variant="outline" size="sm" onClick={() => { setError(null); setIndexCode(''); setIndexRate(''); setIndexMode('MANUAL'); setDialog('index'); }}>
              <Plus className="mr-2 h-3.5 w-3.5" /> Rate Index
            </Button>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Index</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Update mode</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.indices ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  {isLoading ? 'Loading…' : 'No base rate indices configured.'}
                </TableCell>
              </TableRow>
            )}
            {(data?.indices ?? []).map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono font-medium">{row.indexCode}</TableCell>
                <TableCell>{fractionToPercent(row.ratePct)}</TableCell>
                <TableCell>
                  <Badge variant={row.updateMode === 'API' ? 'blue' : 'default'}>
                    {row.updateMode}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {canManage && (
                    <button
                      type="button"
                      aria-label={`Delete ${row.indexCode}`}
                      onClick={() => deleteIndex.mutate(row.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="rounded-lg border bg-background p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">Fee Schedules & Realization Controls</h2>
          {canManage && (
            <Button variant="outline" size="sm" onClick={() => { setError(null); setFeeCode(''); setFeeName(''); setFeeAmount(''); setFeeBasis('TRANSACTION'); setFeeDeduction('AT_DISBURSEMENT'); setDialog('fee'); }}>
              <Plus className="mr-2 h-3.5 w-3.5" /> Fee
            </Button>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Charged per</TableHead>
              <TableHead>Deduction</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.fees ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  {isLoading ? 'Loading…' : 'No fees configured.'}
                </TableCell>
              </TableRow>
            )}
            {(data?.fees ?? []).map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono">{row.feeCode}</TableCell>
                <TableCell>{row.feeName}</TableCell>
                <TableCell>{parseFloat(row.amount).toFixed(2)}</TableCell>
                <TableCell className="text-muted-foreground">{row.chargeBasis}</TableCell>
                <TableCell className="text-muted-foreground">{row.deductionRule}</TableCell>
                <TableCell className="text-right">
                  {canManage && (
                    <button
                      type="button"
                      aria-label={`Delete ${row.feeCode}`}
                      onClick={() => deleteFee.mutate(row.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="rounded-lg border bg-background p-4">
        <h2 className="mb-3 font-medium">Penalty & Day-Count Presets</h2>
        <div className="grid max-w-xl grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bf-daycount">Day-count convention</Label>
            <select
              id="bf-daycount"
              className={selectClass}
              value={dayCount}
              disabled={!canManage}
              onChange={(e) => setDayCount(e.target.value)}
            >
              <option value="ACT_360">Actual/360</option>
              <option value="ACT_365">Actual/365</option>
              <option value="THIRTY_360">30/360</option>
            </select>
          </div>
          <div>
            <Label htmlFor="bf-penalty">Penalty margin % (over base index)</Label>
            <Input
              id="bf-penalty"
              value={penaltyPct}
              disabled={!canManage}
              onChange={(e) => setPenaltyPct(e.target.value)}
              placeholder="e.g. 3"
            />
          </div>
        </div>
        {canManage && (
          <div className="mt-3">
            <Button size="sm" onClick={saveSettings} disabled={patchSettings.isPending}>
              Save Settings
            </Button>
          </div>
        )}
      </section>

      <Dialog open={dialog === 'index'} onOpenChange={() => setDialog(null)}>
        <DialogTitle>Base Rate Index</DialogTitle>
        <DialogDescription>
          Same code upserts in place (e.g. a manual SOFR refresh).
        </DialogDescription>
        <div className="space-y-3">
          <div>
            <Label htmlFor="idx-code">Index code (e.g. SOFR, SONIA)</Label>
            <Input id="idx-code" value={indexCode} onChange={(e) => setIndexCode(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="idx-rate">Rate %</Label>
            <Input id="idx-rate" value={indexRate} onChange={(e) => setIndexRate(e.target.value)} placeholder="e.g. 5.31" />
          </div>
          <div>
            <Label htmlFor="idx-mode">Update mode</Label>
            <select id="idx-mode" className={selectClass} value={indexMode} onChange={(e) => setIndexMode(e.target.value)}>
              <option value="MANUAL">Manual update</option>
              <option value="API">API anchor</option>
            </select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
          <Button disabled={!indexCode.trim() || !indexRate.trim() || upsertIndex.isPending} onClick={submitIndex}>
            Save Index
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={dialog === 'fee'} onOpenChange={() => setDialog(null)}>
        <DialogTitle>Service Charge</DialogTitle>
        <DialogDescription>Same fee code upserts in place.</DialogDescription>
        <div className="space-y-3">
          <div>
            <Label htmlFor="fee-code">Fee code (e.g. KYC_CHECK)</Label>
            <Input id="fee-code" value={feeCode} onChange={(e) => setFeeCode(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="fee-name">Fee name</Label>
            <Input id="fee-name" value={feeName} onChange={(e) => setFeeName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="fee-amount">Amount</Label>
            <Input id="fee-amount" value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} placeholder="e.g. 75" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="fee-basis">Charged per</Label>
              <select id="fee-basis" className={selectClass} value={feeBasis} onChange={(e) => setFeeBasis(e.target.value)}>
                <option value="TRANSACTION">Transaction</option>
                <option value="AUDIT">Audit</option>
                <option value="CHECK">Check</option>
                <option value="MONTH">Month</option>
              </select>
            </div>
            <div>
              <Label htmlFor="fee-deduct">Deduction rule</Label>
              <select id="fee-deduct" className={selectClass} value={feeDeduction} onChange={(e) => setFeeDeduction(e.target.value)}>
                <option value="AT_DISBURSEMENT">Deduct at disbursement</option>
                <option value="MONTHLY_INVOICE">Monthly invoice</option>
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
          <Button disabled={!feeCode.trim() || !feeName.trim() || !feeAmount.trim() || upsertFee.isPending} onClick={submitFee}>
            Save Fee
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default BillingFees;
