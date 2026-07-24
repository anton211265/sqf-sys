import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

import { Badge } from 'components/ui/badge';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from 'components/ui/table';
import { CRC } from 'constants/routes';
import { useOffer, useOfferAction, useSaveOffer, useSimulate } from 'hooks/useOffers';
import { useHasPermission } from 'hooks/useRbac';
import { SimulationResult } from 'service/offers';
import { getApiResponseErrorMsg } from 'utils/apiHelper';

/** Field sets per scenario (labels; rates are fractions). */
const FIELDS: Record<string, { key: string; label: string }[]> = {
  POST_FACTORING: [
    { key: 'unexpiredContractValue', label: 'Unexpired contract value' },
    { key: 'facilityLimit', label: 'Facility limit' },
    { key: 'tenureMonths', label: 'Tenure (monthly invoices)' },
    { key: 'advanceRate', label: 'Factoring advance (fraction)' },
    { key: 'adminFeeRate', label: 'Admin fee per invoice (fraction)' },
    { key: 'creditPeriodDays', label: 'Credit period (days)' },
    { key: 'profitRatePa', label: 'Profit rate p.a. (fraction)' },
    { key: 'collectionPeriodMonths', label: 'Collection period (months)' },
    { key: 'processingFeeOnApplication', label: 'Processing fee on application' },
    { key: 'remittanceFeePerInvoice', label: 'Remittance fee per invoice' },
    { key: 'otherFees', label: 'Other fees (LOU/LOS/advisory)' },
    { key: 'dayCountBase', label: 'Day-count base (360/365)' },
  ],
  PRE_POST_FACTORING: [
    { key: 'preFacilityLimit', label: 'Pre-factoring facility limit' },
    { key: 'preLockInDays', label: 'Pre credit period / lock-in (days)' },
    { key: 'preProfitRateFlat', label: 'Pre profit rate (flat, fraction)' },
  ],
  TERM_LOAN: [
    { key: 'loanAmount', label: 'Facility limit' },
    { key: 'instalments', label: 'No. of instalments (months)' },
    { key: 'tlRateFlatMonthly', label: 'Profit rate per month (fraction)' },
    { key: 'tlProcessingFeeRate', label: 'Processing fee rate (fraction)' },
    { key: 'otherFees', label: 'Other fees' },
  ],
  SCF: [
    { key: 'monthlyApprovedInvoiceVolume', label: 'Monthly approved invoice volume' },
    { key: 'scfAdvanceRate', label: 'Advance rate (fraction, ≤ 1.0)' },
    { key: 'scfDiscountRatePa', label: 'Financing discount p.a. (fraction)' },
    { key: 'buyerTermsDays', label: 'Buyer payment terms (days)' },
    { key: 'tenureMonths', label: 'Programme tenure (months)' },
    { key: 'processingFeeOnApplication', label: 'Processing fee on application' },
    { key: 'dayCountBase', label: 'Day-count base (360/365)' },
  ],
};
const fieldsFor = (scenario: string) =>
  scenario === 'PRE_POST_FACTORING'
    ? [...FIELDS.PRE_POST_FACTORING, ...FIELDS.POST_FACTORING]
    : FIELDS[scenario] ?? FIELDS.POST_FACTORING;

const OfferWorkspace: React.FC = () => {
  const { id } = useParams();
  const offerId = parseInt(id ?? '', 10);
  const navigate = useNavigate();
  const hasPermission = useHasPermission();
  const { data: offer } = useOffer(Number.isInteger(offerId) ? offerId : null);
  const saveOffer = useSaveOffer();
  const action = useOfferAction();
  const simulate = useSimulate();

  const [inputs, setInputs] = React.useState<Record<string, any>>({});
  const [preview, setPreview] = React.useState<SimulationResult | null>(null);
  const [loadedFor, setLoadedFor] = React.useState<number | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [errs, setErrs] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (offer && offer.id !== loadedFor) {
      setInputs({ ...(offer.inputs ?? {}) });
      setPreview((offer.outputs as SimulationResult) ?? null);
      setLoadedFor(offer.id);
    }
  }, [offer, loadedFor]);

  if (!offer) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  const editable = offer.status === 'DRAFT' && hasPermission('risk_offers_manage');
  const result = preview;
  const cardDefaults = offer.rateCardSnapshot?.params ?? {};

  const run = async (a: string, note?: string) => {
    setMsg(null); setErrs([]);
    try {
      await action.mutateAsync({ id: offer.id, action: a, note });
      setMsg(`Action "${a}" applied.`);
    } catch (e: any) {
      const d = e?.response?.data;
      setErrs(Array.isArray(d?.errors) ? d.errors : [getApiResponseErrorMsg(e)]);
    }
  };

  const doSimulate = async () => {
    setErrs([]);
    try { setPreview(await simulate.mutateAsync({ scenario: offer.scenario, inputs })); }
    catch (e) { setErrs([getApiResponseErrorMsg(e)]); }
  };

  const doSave = async () => {
    setMsg(null); setErrs([]);
    try {
      const saved = await saveOffer.mutateAsync({ id: offer.id, inputs });
      setPreview((saved.outputs as SimulationResult) ?? null);
      setMsg('Draft saved (outputs recomputed server-side).');
    } catch (e) { setErrs([getApiResponseErrorMsg(e)]); }
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button type="button" className="text-xs text-muted-foreground hover:underline" onClick={() => navigate(CRC.OFFERS)}>← Offer queue</button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{offer.companyName ?? `Application #${offer.applicationId}`}</h1>
            <Badge variant="outline">{offer.productCode}</Badge>
            <Badge>{offer.status.replace(/_/g, ' ')}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {offer.scenario.replace(/_/g, ' ')} · rate card v{offer.rateCardSnapshot?.version ?? '—'} defaults prefilled
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {editable && (
            <>
              <Button variant="outline" onClick={doSimulate} disabled={simulate.isPending}>Simulate</Button>
              <Button onClick={doSave} disabled={saveOffer.isPending}>Save draft</Button>
              <Button variant="outline" onClick={() => run('submit')}>Submit for check</Button>
            </>
          )}
          {offer.status === 'PENDING_CHECK' && hasPermission('risk_offers_check') && (
            <>
              <Button onClick={() => run('check')}>Verify (2nd CRA)</Button>
              <Button variant="outline" onClick={() => run('return', window.prompt('Note to the maker:') ?? undefined)}>Return</Button>
            </>
          )}
          {offer.status === 'CHECKED' && hasPermission('risk_offers_approve') && (
            <>
              <Button onClick={() => run('approve')}>Approve &amp; send (CRC Manager)</Button>
              <Button variant="outline" onClick={() => run('reject', window.prompt('Rejection note:') ?? undefined)}>Reject</Button>
            </>
          )}
          {offer.status === 'SENT' && hasPermission('risk_offers_resolve') && (
            <>
              <Button onClick={() => run('accept')}>Mark accepted (dev stub)</Button>
              <Button variant="outline" onClick={() => run('decline')}>Mark declined</Button>
            </>
          )}
          {offer.status === 'LAPSED' && hasPermission('risk_offers_resolve') && (
            <>
              <Button onClick={() => run('refresh')}>Refresh offer (unchanged)</Button>
              <Button variant="outline" onClick={() => run('close')}>Close &amp; archive</Button>
            </>
          )}
        </div>
      </div>

      {msg && <p className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-800">{msg}</p>}
      {errs.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800">
          {errs.map((e) => <p key={e}>• {e}</p>)}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Inputs */}
        <section className="rounded-lg border bg-background p-4">
          <h2 className="mb-3 font-medium">Simulator inputs</h2>
          {offer.scenario === 'TERM_LOAN' && (
            <div className="mb-2">
              <Label>Convention</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                disabled={!editable}
                value={inputs.tlConvention ?? 'FLAT'}
                onChange={(e) => setInputs({ ...inputs, tlConvention: e.target.value })}
              >
                <option value="FLAT">Flat (workbook convention)</option>
                <option value="REDUCING_BALANCE">Reducing balance</option>
              </select>
            </div>
          )}
          <div className="grid gap-2 md:grid-cols-2">
            {fieldsFor(offer.scenario).map((f) => {
              const overridden = offer.overrides?.[f.key];
              return (
                <div key={f.key}>
                  <Label className="text-xs">{f.label}</Label>
                  <Input
                    type="number" step="any" className="h-8"
                    disabled={!editable}
                    value={inputs[f.key] ?? ''}
                    onChange={(e) => setInputs({ ...inputs, [f.key]: e.target.value === '' ? undefined : Number(e.target.value) })}
                  />
                  {overridden && (
                    <p className="text-[11px] text-amber-700">override — card default {String(overridden.default)}</p>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Rates are fractions (0.12 = 12%). Prefilled defaults come from the published
            rate card; every change from a default is recorded for the checker.
          </p>
        </section>

        {/* Outputs */}
        <section className="space-y-3 rounded-lg border bg-background p-4">
          <h2 className="font-medium">Simulation</h2>
          {!result && <p className="text-sm text-muted-foreground">Run Simulate to compute.</p>}
          {result && result.warnings.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
              {result.warnings.map((w) => <p key={w}>• {w}</p>)}
            </div>
          )}
          {result && result.warnings.length === 0 && (
            <>
              <div className="flex flex-wrap gap-3">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">Highest exposure</div>
                  <div className="text-xl font-semibold">{result.highestExposure.amount.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">month {result.highestExposure.monthIndex}</div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">Projected profit</div>
                  <div className="text-xl font-semibold">{result.totalProjectedProfit.toLocaleString()}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {Object.entries(result.monthlyEconomics).map(([k, v]) => (
                  <div key={k} className="flex justify-between rounded border bg-muted/20 px-2 py-1">
                    <span className="text-muted-foreground">{k.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                    <span className="font-medium">{Number(v).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result.schedule}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={11} />
                    <YAxis fontSize={11} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <Tooltip formatter={(v: any) => Number(v).toLocaleString()} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="exposure" stroke="#0369A1" fill="#0369A1" fillOpacity={0.25} name="Funding exposure" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Profit line</TableHead><TableHead className="text-right">Amount</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {result.profitProjection.map((row) => (
                    <TableRow key={row.label}>
                      <TableCell className="text-xs">{row.label}</TableCell>
                      <TableCell className="text-right text-xs">{row.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
          <p className="border-t pt-2 text-xs text-muted-foreground">
            Maker #{offer.makerPersonId}
            {offer.checkerPersonId ? ` · checked by #${offer.checkerPersonId}` : ''}
            {offer.approverPersonId ? ` · approved by #${offer.approverPersonId}` : ''}
            {offer.resolutionNote ? ` · note: ${offer.resolutionNote}` : ''}
          </p>
        </section>
      </div>
    </div>
  );
};

export default OfferWorkspace;
