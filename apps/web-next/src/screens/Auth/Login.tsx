import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from 'components/ui/card';
import useGetOrgsByEmail from 'hooks/useGetOrgsByEmail';
import useLogin from 'hooks/useLogin';
import useGetLogInPersonDetail from 'hooks/useGetLogInPersonDetail';
import { getAccessToken } from 'api/axiosClient';
import { setData } from 'redux/user';
import { HOME } from 'constants/routes';
import { IGetOrgsByEmailResponse } from 'service/getOrgsByEmail';
import LoginHero from 'components/LoginHero';

/**
 * Auth screen for the web-next chassis — same 2-step email -> password+org
 * flow as apps/web, rebuilt on shadcn/ui + Tailwind instead of Mantine.
 * Hero artwork is the real Synlian brand asset Tony supplied; form
 * layout/copy is still provisional pending the real storyboard. No SSO
 * option — Microsoft SSO/MSAL was fully removed from this platform (see
 * CLAUDE.md "Auth Flow"), email/password JWT is the only auth flow.
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
      <Card className="w-full max-w-sm lg:border-0 lg:shadow-none lg:bg-transparent">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Enter your details to sign in to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="Email"
              value={email}
              disabled={step === 'credentials'}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {step === 'credentials' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
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
        </CardContent>
        <CardFooter className="flex gap-2">
          {step === 'credentials' && (
            <Button variant="outline" onClick={() => setStep('email')}>
              Back
            </Button>
          )}
          <Button
            className="flex-1"
            disabled={orgsMutation.isPending || loginMutation.isPending}
            onClick={step === 'email' ? handleGetOrgs : handleLogin}
          >
            {step === 'email' ? 'Continue' : 'Login'}
          </Button>
        </CardFooter>
      </Card>
    </LoginHero>
  );
};

export default Login;
