import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { Button } from 'components/ui/button';
import { Card } from 'components/ui/card';
import { PORTAL } from 'constants/routes';
import { esignDocument } from 'service/passkey';
import { getAgreement, signAgreement } from 'service/portal';
import { getApiResponseErrorMsg } from 'utils/apiHelper';

/** Facility agreement execution — same passkey e-signature ceremony as the
 * ILO; on signing the facility goes live (tracked, external-audit-grade:
 * hash + credential + timestamp + IP recorded immutably). */
const AgreementView: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: agreement, isLoading, isError } = useQuery({
    queryKey: ['portal', 'agreement'], queryFn: getAgreement, retry: false,
  });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const sign = async () => {
    if (!agreement?.agreementSha256) return;
    setBusy(true);
    setError(null);
    try {
      const esignToken = await esignDocument(agreement.agreementSha256);
      await signAgreement(esignToken);
      queryClient.invalidateQueries({ queryKey: ['portal', 'agreement'] });
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-2xl p-6">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {isError && (
          <>
            <h1 className="text-xl font-semibold">No agreement yet</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your facility agreement will appear here once the funder&apos;s operations
              team prepares and approves it.
            </p>
          </>
        )}
        {agreement && (
          <>
            <h1 className="text-xl font-semibold">Facility Agreement</h1>
            <p className="text-sm text-muted-foreground">{agreement.companyName} · {agreement.productCode}</p>
            <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-md border bg-background p-4 text-xs leading-relaxed">
              {agreement.agreementText}
            </pre>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Document reference (SHA-256): {agreement.agreementSha256?.slice(0, 16)}…
            </p>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            {agreement.status === 'PENDING_SIGNATURE' && (
              <Button className="mt-4" onClick={sign} disabled={busy}>
                {busy ? 'Waiting for your passkey…' : 'Execute agreement — sign with passkey'}
              </Button>
            )}
            {agreement.status === 'EXECUTED' && (
              <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm">
                <p className="font-medium">Facility in force</p>
                <p className="mt-1 text-muted-foreground">
                  Executed {agreement.signedAt ? new Date(agreement.signedAt).toLocaleString() : ''} ·
                  contract #{agreement.contractId}. Your product workspace activates as the
                  operations features roll out.
                </p>
              </div>
            )}
            <Button className="mt-4 ml-2" variant="outline" onClick={() => navigate(PORTAL.HOME)}>
              Back to portal
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};

export default AgreementView;
