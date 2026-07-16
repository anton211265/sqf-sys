import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { Card, CardContent, CardFooter } from 'components/ui/card';
import useGetOrgsByEmail from 'hooks/useGetOrgsByEmail';
import useLogin from 'hooks/useLogin';
import useGetLogInPersonDetail from 'hooks/useGetLogInPersonDetail';
import { getAccessToken } from 'api/axiosClient';
import { setData } from 'redux/user';
import { HOME } from 'constants/routes';
import { IGetOrgsByEmailResponse } from 'service/getOrgsByEmail';
import LoginHero from 'components/LoginHero';

// Heading/button colors sampled from an earlier version of the hero artwork
// that had a baked-in mockup card (since replaced by
// apps/web-next/public/image.png, which has no mockup card to match) —
// kept because they still look right against the current background.
const HEADING_NAVY = '#0B2D82';
const BUTTON_GRADIENT = 'linear-gradient(to right, #1F72CE, #0F4CAF)';

/**
 * Auth screen for the web-next chassis — same 2-step email -> password+org
 * flow as apps/web, rebuilt on shadcn/ui + Tailwind instead of Mantine.
 * Card floats in the open space of the hero artwork (LoginHero), styled
 * with navy heading/gradient button/icon-prefixed fields to fit that
 * artwork's palette. No SSO option — Microsoft SSO/MSAL was fully removed
 * from this platform (see CLAUDE.md "Auth Flow"), email/password JWT is
 * the only auth flow.
 */
const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [step, setStep] = useState<'email' | 'credentials'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgId, setOrgId] = useState('');
  const [orgs, setOrgs] = useState<IGetOrgsByEmailResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const orgsMutation = useGetOrgsByEmail();
  const loginMutation = useLogin();
  const { data: person, error: personError } = useGetLogInPersonDetail();

  useEffect(() => {
    if (!getAccessToken() || !person) return;
    dispatch(setData({ data: person }));
    navigate(HOME);
  }, [person, dispatch, navigate]);

  useEffect(() => {
    if (personError) setError((personError as Error).message);
  }, [personError]);

  const handleGetOrgs = () => {
    setError(null);
    orgsMutation.mutate(
      { email },
      {
        onSuccess: (data) => {
          setOrgs(data);
          if (data.length === 1) setOrgId(data[0].id.toString());
          setStep('credentials');
        },
        onError: (e) => setError((e as Error).message),
      },
    );
  };

  const handleLogin = () => {
    setError(null);
    loginMutation.mutate(
      { email, password, orgId: parseInt(orgId, 10) },
      { onError: (e) => setError((e as Error).message) },
    );
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

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                placeholder="Email"
                className="pl-9"
                value={email}
                disabled={step === 'credentials'}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {step === 'credentials' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    className="pl-9 pr-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {!isSentinel && (
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
            </>
          )}

          <div className="flex gap-2">
            {step === 'credentials' && (
              <Button variant="outline" onClick={() => setStep('email')}>
                Back
              </Button>
            )}
            <Button
              className="flex-1 text-white border-0"
              style={{ background: BUTTON_GRADIENT }}
              disabled={orgsMutation.isPending || loginMutation.isPending}
              onClick={step === 'email' ? handleGetOrgs : handleLogin}
            >
              {step === 'email' ? 'Continue' : 'Login'}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="pt-0 justify-center">
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
