import React, { FC, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Card, Text, Title } from '@mantine/core';
import { IconShieldCheck } from '@tabler/icons-react';
import { CLIENT_DASHBOARD } from 'constants/routes';
import { approveQrLogin } from 'service/passkey';

/**
 * Phone side of the QR cross-device login (/mobile-auth?session=...#pin=...).
 * Requires a signed-in session on this phone (PrivateRoute) AND a fresh
 * passkey assertion. Mirrors apps/web-next/src/screens/Auth/MobileAuth.tsx.
 */
const MobileAuth: FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'ready' | 'authenticating' | 'done' | 'error'>(
    'ready',
  );
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session');
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
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
      <Card shadow="md" padding="xl" radius="md" w={400} style={{ textAlign: 'center' }}>
        <Title order={3}>Computer sign-in request</Title>

        {!paramsValid && (
          <Text c="red" size="sm" mt="md">
            This link is incomplete — rescan the QR code on your computer.
          </Text>
        )}

        {paramsValid && status === 'ready' && (
          <>
            <Text size="sm" c="dimmed" mt="md">
              A computer is asking to sign in to your SQF account. Only approve
              if the QR code you scanned is on your own screen, right in front
              of you.
            </Text>
            <Button
              fullWidth
              mt="lg"
              leftSection={<IconShieldCheck size={16} />}
              onClick={handleApprove}
            >
              Verify &amp; approve sign-in
            </Button>
            <Button
              fullWidth
              mt="sm"
              variant="outline"
              onClick={() => navigate(CLIENT_DASHBOARD.DOC_MGT_CONSENSUS_MESSAGING)}
            >
              Reject
            </Button>
          </>
        )}

        {status === 'authenticating' && (
          <Text size="sm" fw={600} mt="md">
            Confirm with your fingerprint or face…
          </Text>
        )}

        {status === 'done' && (
          <>
            <Text size="xl" mt="md">
              ✓
            </Text>
            <Text size="sm" mt="sm">
              The computer is now signed in. You can close this tab.
            </Text>
          </>
        )}

        {status === 'error' && (
          <>
            <Text c="red" size="sm" mt="md">
              {error}
            </Text>
            <Button
              fullWidth
              mt="sm"
              variant="outline"
              onClick={() => setStatus('ready')}
            >
              Try again
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};

export default MobileAuth;
