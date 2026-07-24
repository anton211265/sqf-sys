import * as React from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from 'components/ui/button';
import { Card } from 'components/ui/card';
import { PORTAL } from 'constants/routes';
import { useApplication } from 'hooks/usePortal';

const STATUS_COPY: Record<string, { title: string; body: string }> = {
  SUBMITTED: {
    title: 'Application received',
    body: 'Your application is being processed through the funder’s risk assessment. This normally completes shortly after your financial documents are verified.',
  },
  SCORED_PASS: {
    title: 'Under review',
    body: 'Your application has passed the initial assessment and is with the funder’s credit team. Your relationship manager will contact you with the next steps.',
  },
  IN_CRC_REVIEW: {
    title: 'Under review',
    body: 'Your application is with the funder’s credit and compliance team.',
  },
  SCORED_FAIL: {
    title: 'Additional review required',
    body: 'Your application needs additional review. A relationship manager will contact you to discuss the next steps.',
  },
  CLOSED_ARCHIVED: {
    title: 'Application closed',
    body: 'This application has been closed. Contact the funder if you would like to re-apply.',
  },
};

const ApplicationStatus: React.FC = () => {
  const navigate = useNavigate();
  const { data: application, isLoading } = useApplication();

  React.useEffect(() => {
    if (application?.status === 'DRAFT') navigate(PORTAL.APPLICATION, { replace: true });
  }, [application, navigate]);

  const copy = application ? STATUS_COPY[application.status] : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg p-6">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {application && copy && (
          <>
            <h1 className="text-xl font-semibold">{copy.title}</h1>
            <p className="mt-1 text-xs text-muted-foreground">{application.applicationNumber}</p>
            <p className="mt-3 text-sm">{copy.body}</p>
            {application.submittedAt && (
              <p className="mt-3 text-xs text-muted-foreground">
                Submitted {new Date(application.submittedAt).toLocaleString()}
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

export default ApplicationStatus;
