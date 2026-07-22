import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint } from 'lucide-react';

import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { Card, CardContent } from 'components/ui/card';
import { AUTH } from 'constants/routes';
import { enrollPasskey } from 'service/passkey';
import LoginHero from 'components/LoginHero';

/**
 * First-passkey enrollment via a one-time link (/enroll#token=...). The
 * token rides in the URL fragment so it never reaches server logs. This is
 * the only entry path for a new account — there are no passwords.
 */
const Enroll: React.FC = () => {
  const navigate = useNavigate();
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrolledEmail, setEnrolledEmail] = useState<string | null>(null);

  // Read once — navigation within the SPA can clear the hash
  const token = useMemo(() => {
    const match = window.location.hash.match(/token=([^&]+)/);
    return match ? match[1] : null;
  }, []);

  const handleEnroll = async () => {
    if (!token) return;
    setError(null);
    setBusy(true);
    try {
      const result = await enrollPasskey(token, label || undefined);
      setEnrolledEmail(result.email);
    } catch (e) {
      if ((e as { name?: string })?.name === 'NotAllowedError') {
        setError('Passkey prompt was cancelled — try again.');
      } else {
        setError((e as Error).message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <LoginHero>
      <Card className="w-full max-w-sm lg:shadow-2xl">
        <CardContent className="space-y-5 p-6">
          <h1 className="text-xl font-bold">Set up your passkey</h1>

          {!token && (
            <p className="text-sm text-destructive">
              This enrollment link is incomplete. Ask your administrator for a
              new one.
            </p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {enrolledEmail ? (
            <div className="space-y-4">
              <p className="text-sm">
                Passkey registered for <strong>{enrolledEmail}</strong>. You
                can now sign in with it.
              </p>
              <Button className="w-full" onClick={() => navigate(AUTH.LOGIN)}>
                Go to sign-in
              </Button>
            </div>
          ) : (
            token && (
              <>
                <p className="text-sm text-muted-foreground">
                  SQF uses passkeys instead of passwords. Your device will ask
                  for Touch ID, Face ID, or your screen-lock PIN.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="label">Device name (optional)</Label>
                  <Input
                    id="label"
                    placeholder="e.g. MacBook Touch ID"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                  />
                </div>
                <Button className="w-full" disabled={busy} onClick={handleEnroll}>
                  <Fingerprint className="mr-2 h-4 w-4" />
                  {busy ? 'Waiting for device…' : 'Register passkey'}
                </Button>
              </>
            )
          )}
        </CardContent>
      </Card>
    </LoginHero>
  );
};

export default Enroll;
