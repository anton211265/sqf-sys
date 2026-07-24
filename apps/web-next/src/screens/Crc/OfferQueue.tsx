import * as React from 'react';
import { useNavigate } from 'react-router-dom';

import { Badge } from 'components/ui/badge';
import { Button } from 'components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from 'components/ui/table';
import { CRC } from 'constants/routes';
import { useIntakeApplications } from 'hooks/useIntake';
import { useCreateOffer, useOffers } from 'hooks/useOffers';
import { useHasPermission } from 'hooks/useRbac';
import { getApiResponseErrorMsg } from 'utils/apiHelper';

const STATUS_BADGE: Record<string, 'default' | 'amber' | 'blue' | 'green' | 'red' | 'purple'> = {
  DRAFT: 'default', PENDING_CHECK: 'amber', CHECKED: 'blue', APPROVED: 'blue',
  SENT: 'purple', ACCEPTED: 'green', DECLINED: 'red', LAPSED: 'red', CLOSED_ARCHIVED: 'default',
};

/** Provisional Offer queue (gate: risk_offers_view). CRA pickup from the
 * CRC bucket creates the offer and moves the application to IN_CRC_REVIEW. */
const OfferQueue: React.FC = () => {
  const navigate = useNavigate();
  const hasPermission = useHasPermission();
  const { data: offers = [] } = useOffers();
  const { data: bucket = [] } = useIntakeApplications('crc');
  const createOffer = useCreateOffer();
  const [error, setError] = React.useState<string | null>(null);
  const canManage = hasPermission('risk_offers_manage');

  const withoutOffer = bucket.filter(
    (a) => a.status === 'SCORED_PASS' && !offers.some((o) => o.applicationId === a.id &&
      !['DECLINED', 'LAPSED', 'CLOSED_ARCHIVED'].includes(o.status)),
  );

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Provisional Offers</h1>
        <p className="text-sm text-muted-foreground">
          CRA maker → second CRA check → CRC Manager approval → sent to the applicant
          (5-working-day acceptance window).
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {canManage && withoutOffer.length > 0 && (
        <section className="rounded-lg border bg-background p-4">
          <h2 className="mb-2 font-medium">Awaiting pickup (CRC bucket)</h2>
          <ul className="space-y-1 text-sm">
            {withoutOffer.map((a) => (
              <li key={a.id} className="flex items-center gap-2">
                <span className="font-medium">{a.companyName || `org #${a.organizationId}`}</span>
                <Badge variant="outline">{a.productCode ?? '—'}</Badge>
                <span className="text-xs text-muted-foreground">Filter-1 {a.filter1Score} ({a.filter1Category} risk)</span>
                <Button
                  size="sm" variant="outline" disabled={createOffer.isPending}
                  onClick={async () => {
                    setError(null);
                    try {
                      const offer = await createOffer.mutateAsync(a.id);
                      navigate(`${CRC.OFFERS}/${offer.id}`);
                    } catch (e) { setError(getApiResponseErrorMsg(e)); }
                  }}
                >
                  Pick up → draft offer
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-lg border bg-background p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Scenario</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Highest exposure</TableHead>
              <TableHead>Projected profit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-muted-foreground">No offers yet.</TableCell></TableRow>
            )}
            {offers.map((o) => (
              <TableRow key={o.id} className="cursor-pointer" onClick={() => navigate(`${CRC.OFFERS}/${o.id}`)}>
                <TableCell className="font-medium">{o.companyName ?? `app #${o.applicationId}`}</TableCell>
                <TableCell className="font-mono text-xs">{o.productCode}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{o.scenario.replace(/_/g, ' ')}</TableCell>
                <TableCell><Badge variant={STATUS_BADGE[o.status] ?? 'default'}>{o.status.replace(/_/g, ' ')}</Badge></TableCell>
                <TableCell className="text-xs">{o.outputs?.highestExposure?.amount?.toLocaleString() ?? '—'}</TableCell>
                <TableCell className="text-xs">{o.outputs?.totalProjectedProfit?.toLocaleString() ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
};

export default OfferQueue;
