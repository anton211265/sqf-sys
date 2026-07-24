import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { Button } from 'components/ui/button';
import { Card } from 'components/ui/card';
import { PORTAL } from 'constants/routes';
import { esignDocument } from 'service/passkey';
import { getOffer, respondOffer } from 'service/portal';
import { getApiResponseErrorMsg } from 'utils/apiHelper';

const TERM_LABELS: Record<string, string> = {
  facilityLimit: 'Facility limit',
  unexpiredContractValue: 'Contract value financed',
  advanceRate: 'Advance rate',
  profitRatePa: 'Profit / discount rate p.a.',
  monthlyRateFlat: 'Profit rate per month',
  tenureMonths: 'Tenure (months)',
  creditPeriodDays: 'Credit period (days)',
  adminFeeRate: 'Admin fee per invoice',
  processingFeeOnApplication: 'Processing fee on application',
};
const fmt = (k: string, v: number) =>
  k.toLowerCase().includes('rate') && v <= 1 ? `${(v * 100).toFixed(2)}%` : v.toLocaleString();

/**
 * Indicative Letter of Offer (Customer Portal pass 2). Acceptance is a
 * passkey e-signature ceremony: a fresh biometric assertion bound to the
 * SHA-256 of exactly these terms — the record stores hash, timestamp, IP
 * and credential id (blueprint acceptance-evidence remedy).
 */
const OfferView: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: offer, isLoading, isError } = useQuery({ queryKey: ['portal', 'offer'], queryFn: getOffer, retry: false });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [declining, setDeclining] = React.useState(false);
  const [reason, setReason] = React.useState('');

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['portal', 'offer'] });

  const accept = async () => {
    if (!offer) return;
    setBusy(true);
    setError(null);
    try {
      // 1) sign the exact terms hash with a fresh passkey assertion
      const esignToken = await esignDocument(offer.termsSha256);
      // 2) submit the signed acceptance
      await respondOffer({ decision: 'accept', termsSha256: offer.termsSha256, esignToken });
      refresh();
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const decline = async () => {
    if (!offer) return;
    setBusy(true);
    setError(null);
    try {
      await respondOffer({ decision: 'decline', termsSha256: offer.termsSha256, reason: reason || undefined });
      setDeclining(false);
      refresh();
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-xl p-6">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {isError && (
          <>
            <h1 className="text-xl font-semibold">No offer yet</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              When the funder approves an indicative offer it will appear here.
            </p>
          </>
        )}
        {offer && (
          <>
            <h1 className="text-xl font-semibold">Indicative Letter of Offer</h1>
            <p className="text-sm text-muted-foreground">
              {offer.companyName} · {offer.terms.productCode}
              {offer.sentAt ? ` · issued ${new Date(offer.sentAt).toLocaleDateString()}` : ''}
            </p>

            <div className="mt-4 space-y-1 rounded-md border bg-background p-4 text-sm">
              {Object.entries(offer.terms.keyTerms)
                .filter(([, v]) => v !== null && v !== undefined)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-muted-foreground">{TERM_LABELS[k] ?? k}</span>
                    <span className="font-medium">{fmt(k, v as number)}</span>
                  </div>
                ))}
              <p className="border-t pt-2 text-[11px] text-muted-foreground">
                Document reference (SHA-256): {offer.termsSha256.slice(0, 16)}… · Subject to
                the funder&apos;s facility agreement, compliance review and final approvals.
              </p>
            </div>

            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

            {offer.status === 'SENT' && !declining && (
              <div className="mt-4 flex gap-2">
                <Button onClick={accept} disabled={busy}>
                  {busy ? 'Waiting for your passkey…' : 'Accept & sign with passkey'}
                </Button>
                <Button variant="outline" disabled={busy} onClick={() => setDeclining(true)}>
                  Decline
                </Button>
              </div>
            )}
            {offer.status === 'SENT' && declining && (
              <div className="mt-4 space-y-2">
                <textarea
                  className="min-h-20 w-full rounded-md border border-input bg-background p-2 text-sm"
                  placeholder="Reason (optional) — your relationship manager will follow up"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setDeclining(false)}>Back</Button>
                  <Button onClick={decline} disabled={busy}>Confirm decline</Button>
                </div>
              </div>
            )}

            {offer.status === 'ACCEPTED' && !offer.registrationFeeConfirmedAt && (
              <div className="mt-4 rounded-md border border-sky-200 bg-sky-50 p-3 text-sm">
                <p className="font-medium">Offer accepted — registration fee pending</p>
                <p className="mt-1 text-muted-foreground">
                  The funder will invoice the registration fee to your company email.
                  Once payment is received your client account activates and the
                  compliance review begins.
                </p>
              </div>
            )}
            {offer.status === 'ACCEPTED' && offer.registrationFeeConfirmedAt && (
              <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm">
                <p className="font-medium">Welcome — you are now a client</p>
                <p className="mt-1 text-muted-foreground">
                  Registration fee received. Your account is active (facility pending final
                  agreements); the funder&apos;s compliance team is completing onboarding.
                </p>
              </div>
            )}
            {offer.status === 'DECLINED' && (
              <p className="mt-4 text-sm text-muted-foreground">
                You declined this offer. Your relationship manager will be in touch.
              </p>
            )}
            {offer.status === 'LAPSED' && (
              <p className="mt-4 text-sm text-muted-foreground">
                The acceptance window has passed. Contact your relationship manager to
                refresh the offer.
              </p>
            )}

            <Button className="mt-4" variant="outline" onClick={() => navigate(PORTAL.HOME)}>
              Back to portal
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};

export default OfferView;
