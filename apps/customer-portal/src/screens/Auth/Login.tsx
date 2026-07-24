import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, QrCode, User } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { Card, CardContent, CardFooter } from 'components/ui/card';
import useGetOrgsByEmail from 'hooks/useGetOrgsByEmail';
import useGetLogInPersonDetail from 'hooks/useGetLogInPersonDetail';
import { getAccessToken } from 'api/axiosClient';
import { setData } from 'redux/user';
import { HOME } from 'constants/routes';
import { IGetOrgsByEmailResponse } from 'service/getOrgsByEmail';
import {
  IQrSession,
  isUnsupportedError,
  openQrSocket,
  passkeyLogin,
  qrComplete,
  qrInitiate,
} from 'service/passkey';
import LoginHero from 'components/LoginHero';

// Heading/button colors sampled from an earlier version of the hero artwork
// that had a baked-in mockup card (since replaced by
// apps/web-next/public/image.png, which has no mockup card to match) —
// kept because they still look right against the current background.
const HEADING_NAVY = '#0B2D82';
const BUTTON_GRADIENT = 'linear-gradient(to right, #1F72CE, #0F4CAF)';

/**
 * Auth screen for the web-next chassis. 2-step email -> org flow, then
 * WebAuthn passkey sign-in (password login was removed 2026-07-22). If this
 * machine has no usable authenticator, a QR fallback lets an already
 * signed-in phone approve the login (see /mobile-auth).
 */
const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [step, setStep] = useState<'email' | 'passkey'>('email');
  const [email, setEmail] = useState('');
  const [orgId, setOrgId] = useState('');
  const [orgs, setOrgs] = useState<IGetOrgsByEmailResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [qrSession, setQrSession] = useState<IQrSession | null>(null);
  const [, setRenderTick] = useState(0); // re-render after tokens land
  const wsRef = useRef<WebSocket | null>(null);

  const orgsMutation = useGetOrgsByEmail();
  const { data: person, error: personError } = useGetLogInPersonDetail();

  useEffect(() => {
    if (!getAccessToken() || !person) return;
    // Keep the signed-in org id with the identity — the application wizard
    // needs it as subjectOrganizationId for document uploads.
    dispatch(setData({ data: { ...person, orgId: parseInt(orgId, 10) || undefined } }));
    navigate(HOME);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person, dispatch, navigate]);

  useEffect(() => {
    if (personError) setError((personError as Error).message);
  }, [personError]);

  // Close any open QR socket when leaving the screen
  useEffect(() => () => wsRef.current?.close(), []);

  const handleGetOrgs = () => {
    setError(null);
    orgsMutation.mutate(
      { email },
      {
        onSuccess: (data) => {
          setOrgs(data);
          if (data.length === 1) setOrgId(data[0].id.toString());
          setStep('passkey');
        },
        onError: (e) => setError((e as Error).message),
      },
    );
  };

  const handlePasskeyLogin = async () => {
    setError(null);
    setBusy(true);
    try {
      await passkeyLogin({ email, orgId: parseInt(orgId, 10) });
      setRenderTick((t) => t + 1); // token now in memory — person query enables
    } catch (e) {
      if (isUnsupportedError(e)) {
        // This machine can't do passkeys — switch to the QR relay
        await startQrFallback();
      } else if ((e as { name?: string })?.name === 'NotAllowedError') {
        setError('Passkey prompt was cancelled.');
      } else {
        setError((e as Error).message);
      }
    } finally {
      setBusy(false);
    }
  };

  const startQrFallback = async () => {
    setError(null);
    wsRef.current?.close();
    try {
      const session = await qrInitiate();
      setQrSession(session);
      wsRef.current = openQrSocket(session.qrSessionId, {
        onAuthCode: async (authCode) => {
          try {
            await qrComplete(session.qrSessionId, authCode);
            setQrSession(null);
            setRenderTick((t) => t + 1);
          } catch (e) {
            setError((e as Error).message);
          }
        },
        // QR sessions live 60s — mint a fresh one automatically
        onExpired: () => startQrFallback(),
        onInvalid: () => {
          setQrSession(null);
          setError('QR session was rejected. Try again.');
        },
      });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const isSentinel = orgs.length === 1 && orgs[0].id === 0;

  return (
    <LoginHero>
      <Card className="w-full max-w-sm lg:shadow-2xl">
        <CardContent className="space-y-5 p-6">
          <div>
            <h1
              className="text-xl font-bold leading-snug"
              style={{ color: HEADING_NAVY, fontFamily: 'Arial, Helvetica, sans-serif' }}
            >
              Financial Services.
              <br />
              Intelligent. Autonomous. Trusted.
            </h1>
            <p
              className="mt-3 text-sm leading-snug"
              style={{ color: HEADING_NAVY, opacity: 0.8, fontFamily: 'Arial, Helvetica, sans-serif' }}
            >
              Agentic AI powering the future of financial services.
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {!qrSession && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    placeholder="Email"
                    className="pl-9"
                    value={email}
                    disabled={step === 'passkey'}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {step === 'passkey' && !isSentinel && (
                <div className="space-y-2">
                  <Label htmlFor="org">Organization</Label>
                  <select
                    id="org"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={orgId}
                    onChange={(e) => setOrgId(e.target.value)}
                  >
                    <option value="" disabled>
                      Select your organization
                    </option>
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2">
                {step === 'passkey' && (
                  <Button variant="outline" onClick={() => setStep('email')}>
                    Back
                  </Button>
                )}
                <Button
                  className="flex-1 text-white border-0"
                  style={{ background: BUTTON_GRADIENT }}
                  disabled={busy || orgsMutation.isPending || (step === 'passkey' && !orgId)}
                  onClick={step === 'email' ? handleGetOrgs : handlePasskeyLogin}
                >
                  {step === 'email' ? (
                    'Continue'
                  ) : (
                    <>
                      <Fingerprint className="mr-2 h-4 w-4" />
                      {busy ? 'Waiting for passkey…' : 'Sign in with passkey'}
                    </>
                  )}
                </Button>
              </div>

              {step === 'passkey' && (
                <button
                  type="button"
                  className="mx-auto flex items-center gap-1 text-xs text-muted-foreground underline"
                  onClick={startQrFallback}
                >
                  <QrCode className="h-3 w-3" />
                  No passkey on this device? Sign in with your phone
                </button>
              )}
            </>
          )}

          {qrSession && (
            <div className="space-y-3 text-center">
              <p className="text-sm font-medium">Sign in with your phone</p>
              <p className="text-xs text-muted-foreground">
                Scan with the phone you already use for SQF. The code expires
                in {qrSession.expiresInSeconds}s and refreshes automatically.
              </p>
              <div className="mx-auto inline-block rounded bg-white p-3">
                <QRCodeSVG value={qrSession.loginUrl} size={180} />
              </div>
              <button
                type="button"
                className="mx-auto block text-xs text-muted-foreground underline"
                onClick={() => {
                  wsRef.current?.close();
                  setQrSession(null);
                }}
              >
                Back to passkey sign-in
              </button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col gap-2 pt-0 justify-center">
          <button
            type="button"
            className="text-sm font-medium text-primary hover:underline"
            onClick={() => navigate('/apply/disclaimer')}
          >
            New user application →
          </button>
          <p
            className="text-center text-xs leading-snug"
            style={{ color: HEADING_NAVY, opacity: 0.75, fontFamily: 'Arial, Helvetica, sans-serif' }}
          >
            Secure. Compliant. Intelligent.
            <br />
            Built for the future of finance.
          </p>
        </CardFooter>
      </Card>
    </LoginHero>
  );
};

export default Login;
