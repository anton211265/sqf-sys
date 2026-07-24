import * as React from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from 'components/ui/button';
import { Card } from 'components/ui/card';
import { PUBLIC } from 'constants/routes';
import { useOnboardingConfig } from 'hooks/usePortal';

/**
 * Pre-registration legal disclaimer (blueprint UX rules): scroll-to-accept
 * enforced, and Terms & Credit Check Authorisation split from Data Privacy
 * Consent into two checkboxes. The accepted text's hash travels with the
 * registration so the immutable acceptance record references the exact
 * version that was seen.
 */
const Disclaimer: React.FC = () => {
  const navigate = useNavigate();
  const { data: config, isLoading, isError } = useOnboardingConfig();
  const [scrolledToEnd, setScrolledToEnd] = React.useState(false);
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = React.useState(false);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 16) {
      setScrolledToEnd(true);
    }
  };

  const proceed = () => {
    sessionStorage.setItem(
      'sqf-portal-acceptance',
      JSON.stringify({
        disclaimerCode: config!.disclaimer.documentCode,
        disclaimerHash: config!.disclaimer.hash,
        acceptedTerms,
        acceptedPrivacy,
      }),
    );
    navigate(PUBLIC.REGISTER);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-2xl p-6">
        <h1 className="text-xl font-semibold">New Financing Application</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          Please read and accept the terms below to begin your application.
        </p>
        {isLoading && <p className="text-sm text-muted-foreground">Loading terms…</p>}
        {isError && (
          <p className="text-sm text-destructive">
            Onboarding is temporarily unavailable — please try again shortly.
          </p>
        )}
        {config && (
          <>
            <div
              onScroll={onScroll}
              className="mb-3 max-h-80 overflow-y-auto whitespace-pre-wrap rounded-md border bg-background p-4 text-sm leading-relaxed"
            >
              {config.disclaimer.body}
            </div>
            {!scrolledToEnd && (
              <p className="mb-2 text-xs text-muted-foreground">
                Scroll to the end of the terms to enable acceptance.
              </p>
            )}
            <label className="mb-2 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                disabled={!scrolledToEnd}
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <span>
                I accept the <strong>Terms of Use and Credit Check Authorisation</strong> and
                confirm I have authority to bind the registering company.
              </span>
            </label>
            <label className="mb-4 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                disabled={!scrolledToEnd}
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
              />
              <span>
                I consent to the <strong>Data Privacy terms</strong> (PDPA 2010) including
                third-party data sharing for underwriting and compliance.
              </span>
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => navigate('/auth/login')}>
                Cancel
              </Button>
              <Button disabled={!scrolledToEnd || !acceptedTerms || !acceptedPrivacy} onClick={proceed}>
                Accept and Proceed
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default Disclaimer;
