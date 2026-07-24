import * as React from 'react';

/**
 * Empty-state screens for CRM nodes whose data source arrives with later
 * domains (approved annotation, decision 2). They hold their nav position
 * and gate keys so the manifest-driven navigation is already final.
 */
const boundary = (title: string, body: string) => {
  const Screen: React.FC = () => (
    <div className="p-6">
      <h1 className="mb-1 text-xl font-semibold">{title}</h1>
      <div className="mt-4 max-w-2xl rounded-lg border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
        {body}
      </div>
    </div>
  );
  return Screen;
};

export const MyApplicants = boundary(
  'My Applicants',
  'Activates with the Customer Portal intake: walk-in and RM-initiated applicants assigned to you will appear here with their onboarding progress, default risk score and the fail-status engagement SLA (10 working days, auto-close).',
);

export const MyClients = boundary(
  'Client Management — Assigned',
  'Activates once clients exist (registration fee flow, Finance Hub): your assigned clients will appear with facility utilisation, DPD/DBT and dilution metrics as those domains land. Directory facts (subscriptions, contracts, invoices) surface first.',
);
