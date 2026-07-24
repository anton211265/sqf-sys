import * as React from 'react';
import { Link } from 'react-router-dom';

import { Badge } from 'components/ui/badge';
import { CONFIG, CRC } from 'constants/routes';
import { useAssessments, useRiskModels } from 'hooks/useCrc';
import { useHasPermission } from 'hooks/useRbac';
import { classificationBadge } from 'lib/crcScoring';

/**
 * CRC Dashboard shell (gate: risk_applications_view). Pass 1: model/
 * assessment tiles + phase-boundary placeholders. The new-application
 * bucket activates when Customer Portal intake starts feeding
 * PENDING_RISK_FILTER_2 applications; monitors activate with the
 * Compliance & Policy Agent.
 */
const CrcDashboard: React.FC = () => {
  const hasPermission = useHasPermission();
  const { data: models = [] } = useRiskModels();
  const { data: assessments = [] } = useAssessments();

  const published = models.filter((m) => m.status === 'PUBLISHED');
  const inChain = models.filter((m) => m.status === 'PENDING_CHECK' || m.status === 'CHECKED');
  const recent = assessments.slice(0, 8);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Credit Risk &amp; Compliance</h1>
        <p className="text-sm text-muted-foreground">
          Team dashboard — application queue, Filter-2 models and assessments
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Published models', published.length],
          ['Awaiting check / publish', inChain.length],
          ['Assessments recorded', assessments.length],
          ['High-risk results', assessments.filter((a) => a.classification === 'HIGH').length],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-lg border bg-background p-4">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-2xl font-semibold">{value}</div>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
        <strong>New application bucket:</strong> activates when Customer Portal onboarding
        lands — applications passing Filter-1 (or flipped to pass by the RM) queue here
        for CRA pickup, oldest first, with the provisional-offer SLA timer running.
      </section>

      <section className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
        <strong>Compliance monitors &amp; alerts:</strong> monthly sanctions / PEP / adverse-media
        sweeps arrive with the Compliance &amp; Policy Agent (post-SQF). Data-mismatch flags
        from 3rd-party credit reports appear here once the agency integration lands.
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border bg-background p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-medium">Filter 2 — model library</h2>
            <Link className="text-sm text-primary hover:underline" to={CRC.MODELS}>Open →</Link>
          </div>
          {models.length === 0 && <p className="text-sm text-muted-foreground">No models yet.</p>}
          <ul className="space-y-1 text-sm">
            {models.slice(0, 6).map((m) => (
              <li key={m.id} className="flex items-center gap-2">
                <Link className="font-medium hover:underline" to={`${CRC.MODELS}/${m.id}`}>{m.riskModelName}</Link>
                <Badge variant={m.status === 'PUBLISHED' ? 'green' : m.status === 'DRAFT' ? 'default' : 'amber'}>
                  {m.status.replace('_', ' ')}
                </Badge>
              </li>
            ))}
          </ul>
          {hasPermission('risk_profiles_view') && (
            <p className="mt-3 border-t pt-2 text-xs text-muted-foreground">
              Filter 1 (default risk profile) governance lives in{' '}
              <Link className="text-primary hover:underline" to={CONFIG.RISK_PROFILES}>Risk Profiles</Link>
              {' '}— remember: Filter-1 bands read the opposite way (high score = low risk).
            </p>
          )}
        </section>

        <section className="rounded-lg border bg-background p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-medium">Latest assessments</h2>
            <Link className="text-sm text-primary hover:underline" to={CRC.ASSESSMENTS}>Run / history →</Link>
          </div>
          {recent.length === 0 && <p className="text-sm text-muted-foreground">No assessments yet.</p>}
          <ul className="space-y-1 text-sm">
            {recent.map((a) => (
              <li key={a.id} className="flex items-center gap-2">
                <span className="font-medium">{a.organizationName ?? `org #${a.organizationId}`}</span>
                <span className="text-muted-foreground">{a.totalScore}</span>
                <Badge variant={classificationBadge(a.classification)}>
                  {a.classification} RISK{a.overrideTripped ? ' (OVERRIDE)' : ''}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default CrcDashboard;
