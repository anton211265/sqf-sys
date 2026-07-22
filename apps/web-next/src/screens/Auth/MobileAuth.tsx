import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

import { Button } from 'components/ui/button';
import { Card, CardContent } from 'components/ui/card';
import { HOME } from 'constants/routes';
import { approveQrLogin } from 'service/passkey';

/**
 * Phone side of the QR cross-device login. Reached by scanning the QR the
 * desktop shows (/mobile-auth?session=...#pin=...). Requires a signed-in
 * session on this phone (route is wrapped in PrivateRoute) AND a fresh
 * passkey assertion — holding an unlocked phone is deliberately not enough.
 */
const MobileAuth: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'ready' | 'authenticating' | 'done' | 'error'>(
    'ready',
  );
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session');
  // Pin travels in the fragment so it never reaches server logs
  const pin = useMemo(() => {
    const match = window.location.hash.match(/pin=([^&]+)/);
    return match ? match[1] : null;
  }, []);

  const paramsValid = Boolean(sessionId && pin);

  const handleApprove = async () => {
    if (!sessionId || !pin) return;
    setError(null);
    setStatus('authenticating');
    try {
      await approveQrLogin(sessionId, pin);
      setStatus('done');
    } catch (e) {
      setStatus('error');
      setError((e as Error).message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-6">
      <Card className="w-full max-w-sm">
        <CardContent className="space-y-5 p-6 text-center">
          <h1 className="text-xl font-bold">Computer sign-in request</h1>

          {!paramsValid && (
            <p className="text-sm text-destructive">
              This link is incomplete — rescan the QR code on your computer.
            </p>
          )}

          {paramsValid && status === 'ready' && (
            <>
              <p className="text-sm text-muted-foreground">
                A computer is asking to sign in to your SQF account. Only
                approve if the QR code you scanned is on your own screen,
                right in front of you.
              </p>
              <Button className="w-full" onClick={handleApprove}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Verify &amp; approve sign-in
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(HOME)}
              >
                Reject
              </Button>
            </>
          )}

          {status === 'authenticating' && (
            <p className="text-sm font-medium">
              Confirm with your fingerprint or face…
            </p>
          )}

          {status === 'done' && (
            <>
              <p className="text-3xl">✓</p>
              <p className="text-sm">
                The computer is now signed in. You can close this tab.
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" className="w-full" onClick={() => navigate(HOME)}>
                Back to home
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileAuth;
