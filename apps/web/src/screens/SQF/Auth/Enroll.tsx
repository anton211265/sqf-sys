import React, { FC, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Text, TextInput, Title } from '@mantine/core';
import { IconFingerprint } from '@tabler/icons-react';
import { AUTH } from 'constants/routes';
import { enrollPasskey } from 'service/passkey';

/**
 * First-passkey enrollment via a one-time link (/enroll#token=...). The
 * token rides in the URL fragment so it never reaches server logs. Mirrors
 * apps/web-next/src/screens/Auth/Enroll.tsx.
 */
const Enroll: FC = () => {
  const navigate = useNavigate();
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrolledEmail, setEnrolledEmail] = useState<string | null>(null);

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
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
      <Card shadow="md" padding="xl" radius="md" w={400}>
        <Title order={3}>Set up your passkey</Title>

        {!token && (
          <Text c="red" size="sm" mt="md">
            This enrollment link is incomplete. Ask your administrator for a
            new one.
          </Text>
        )}

        {error && (
          <Text c="red" size="sm" mt="md">
            {error}
          </Text>
        )}

        {enrolledEmail ? (
          <>
            <Text size="sm" mt="md">
              Passkey registered for <strong>{enrolledEmail}</strong>. You can
              now sign in with it.
            </Text>
            <Button fullWidth mt="lg" onClick={() => navigate(AUTH.LOGIN)}>
              Go to sign-in
            </Button>
          </>
        ) : (
          token && (
            <>
              <Text size="sm" c="dimmed" mt="md">
                SQF uses passkeys instead of passwords. Your device will ask
                for Touch ID, Face ID, or your screen-lock PIN.
              </Text>
              <TextInput
                mt="md"
                label="Device name (optional)"
                placeholder="e.g. MacBook Touch ID"
                value={label}
                onChange={(e) => setLabel(e.currentTarget.value)}
              />
              <Button
                fullWidth
                mt="lg"
                loading={busy}
                leftSection={<IconFingerprint size={16} />}
                onClick={handleEnroll}
              >
                Register passkey
              </Button>
            </>
          )
        )}
      </Card>
    </div>
  );
};

export default Enroll;
