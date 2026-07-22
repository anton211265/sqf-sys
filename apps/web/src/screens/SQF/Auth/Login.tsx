import { IconFingerprint, IconMeteor, IconQrcode } from '@tabler/icons-react';
import ActionCard from 'components/SQF/BaseComponents/ActionCard';
import LoginHero from 'components/SQF/BaseComponents/LoginHero';
import React, { FC, useEffect, useRef, useState } from 'react';
import TextInput from 'components/TextBox/TextBox';
import { QRCodeSVG } from 'qrcode.react';
import {
  Button,
  Checkbox,
  MantineProvider,
  Select,
  Stepper,
  Text,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { ADMIN, CLIENT_DASHBOARD, CLIENTONBOARDING, SUPER_ADMIN, SYSTEM } from 'constants/routes';
import { OrganizationPersonRoleEnum } from 'constants/enum';
import { useForm } from '@mantine/form';
import useGetOrgsByEmail from 'hooks/useGetOrgsByEmail';
import { notifications } from '@mantine/notifications';
import { IGetOrgsByEmailResponse } from 'service/getOrgsByEmail';
import { useLocalStorage } from '@mantine/hooks';
import useGetLogInPersonDetail from 'hooks/useGetLogInPersonDetail';
import { useDispatch } from 'react-redux';
import { setData } from '../../../redux/user';
import { getAccessToken } from '../../../api/axiosClient';
import {
  IQrSession,
  isUnsupportedError,
  openQrSocket,
  passkeyLogin,
  qrComplete,
  qrInitiate,
} from 'service/passkey';

/**
 * Login is passkey-only since password removal (2026-07-22): email -> org
 * selection -> WebAuthn prompt, with a QR relay fallback (approve from an
 * already signed-in phone) for machines without a usable authenticator.
 */
const Login: FC = () => {
  const [savedEmail, setSavedEmail] = useLocalStorage({
    key: 'rememberedEmail',
    defaultValue: '',
  });
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const orgsMutation = useGetOrgsByEmail();
  const [orgs, setOrgs] = useState<IGetOrgsByEmailResponse[]>([]);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [qrSession, setQrSession] = useState<IQrSession | null>(null);
  const [, setRenderTick] = useState(0); // re-render once tokens land
  const wsRef = useRef<WebSocket | null>(null);
  const { data, error, isLoading, refetch: refetchMe } = useGetLogInPersonDetail();
  const dispatch = useDispatch();

  const form = useForm({
    initialValues: {
      email: '',
      orgId: '',
      rememberMe: false,
    },

    validate: (values) => {
      if (active === 0) {
        return {
          email: values.email ? null : 'Invalid email',
        };
      }

      if (active === 1) {
        const isSentinel = orgs.length === 1 && orgs[0].id === 0;
        return {
          orgId: isSentinel || values.orgId ? null : 'Please select an organization',
        };
      }

      return {};
    },
  });

  useEffect(() => {
    if (getAccessToken()) {
      if (error) {
        notifications.show({
          id: 'error',
          title: 'Error',
          message: (error as Error).message,
          color: 'red',
          autoClose: 2000,
        });
      }

      if (data) {
        // Persist identity to Redux so SilentRefresh can restore the session
        // (in-memory access token) from the httpOnly refresh cookie on reload.
        dispatch(setData({ data }));

        const roles: string[] = (data?.organizationPersonRoles ?? []).map(
          (r: { role: string }) => r.role,
        );

        if (roles.includes(OrganizationPersonRoleEnum.SQFSYS)) {
          navigate(SYSTEM.SETUP);
          return;
        }

        if (roles.includes(OrganizationPersonRoleEnum.SUPERUSER)) {
          navigate(SUPER_ADMIN.DASHBOARD);
          return;
        }

        if (
          data?.fullyOnboardedAt !== null &&
          data?.fullyOnboardedAt !== undefined
        ) {
          navigate(CLIENT_DASHBOARD.DOC_MGT_CONSENSUS_MESSAGING);
        } else {
          navigate(CLIENTONBOARDING.WElCOMEPAGE);
        }
      }
    }
  }, [error, data, isLoading, getAccessToken()]);

  useEffect(() => {
    if (savedEmail) {
      form.setFieldValue('email', savedEmail);
      form.setFieldValue('rememberMe', true);
    } else {
      form.setFieldValue('rememberMe', false);
    }
  }, [savedEmail]);

  // Close any open QR socket when leaving the screen
  useEffect(() => () => wsRef.current?.close(), []);

  const handleGetOrgs = () => {
    const { email, rememberMe } = form.values;

    orgsMutation.mutate(
      { email },
      {
        onSuccess: (data) => {
          if (rememberMe) {
            setSavedEmail(email);
          } else {
            setSavedEmail('');
          }

          setOrgs(data);

          // Auto-select when there is exactly one org (covers sentinel id=0 for SQFSYS)
          if (data.length === 1) {
            form.setFieldValue('orgId', data[0].id.toString());
          }

          setActive(1);
        },
        onError: (e) => {
          const message = (e as Error).message;

          notifications.show({
            id: 'error',
            title: 'Error',
            message,
            color: 'red',
            autoClose: 2000,
          });
        },
      }
    );
  };

  const notifyError = (message: string) => {
    notifications.show({
      id: 'error',
      title: 'Error',
      message,
      color: 'red',
      autoClose: 3000,
    });
  };

  const handlePasskeyLogin = async () => {
    const { email, orgId } = form.values;
    setPasskeyBusy(true);
    try {
      await passkeyLogin({ email, orgId: parseInt(orgId || '0') });
      setRenderTick((t) => t + 1);
      if (orgs.length === 1 && orgs[0].id === 0) {
        navigate(SYSTEM.SETUP);
        return;
      }
      refetchMe();
    } catch (e) {
      if (isUnsupportedError(e)) {
        await startQrFallback();
      } else if ((e as { name?: string })?.name === 'NotAllowedError') {
        notifyError('Passkey prompt was cancelled.');
      } else {
        notifyError((e as Error).message);
      }
    } finally {
      setPasskeyBusy(false);
    }
  };

  const startQrFallback = async () => {
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
            refetchMe();
          } catch (e) {
            notifyError((e as Error).message);
          }
        },
        // QR sessions live 60s — mint a fresh one automatically
        onExpired: () => startQrFallback(),
        onInvalid: () => {
          setQrSession(null);
          notifyError('QR session was rejected. Try again.');
        },
      });
    } catch (e) {
      notifyError((e as Error).message);
    }
  };

  const nextStep = () => {
    if (qrSession) {
      // QR panel is showing — primary button backs out to passkey mode
      wsRef.current?.close();
      setQrSession(null);
      return;
    }

    if (form.validate().hasErrors) {
      return;
    }

    if (active === 0) {
      handleGetOrgs();
    }

    if (active === 1) {
      handlePasskeyLogin();
    }
  };

  const prevStep = () => {
    setActive(0);
  };

  const onClickRedirectCreateNewApplication = () => {
    navigate(CLIENTONBOARDING.NEWAPPLICATION);
  };

  return (
    <>
      <div className="flex min-h-screen bg-zinc-100">
        <LoginHero />
        <div className="flex-1 flex items-center justify-center flex-col px-6 py-12">
        <ActionCard
          title={'Welcome back ! 🎉'}
          description={
            qrSession
              ? 'Scan the QR code with the phone you already use for SQF'
              : 'Sign in with your passkey — no password needed'
          }
          Icon={IconMeteor}
          primaryButtonLabel={
            qrSession
              ? 'Back to passkey sign-in'
              : active === 0
                ? 'Continue'
                : passkeyBusy
                  ? 'Waiting for passkey…'
                  : 'Sign in with passkey'
          }
          onClickPrimaryButtonAction={nextStep}
          onClickSecondaryButtonAction={prevStep}
          secondaryButtonLabel={active !== 0 && !qrSession ? 'Back' : ''}
          loading={orgsMutation.isLoading || passkeyBusy}
        >
          {qrSession ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ background: '#fff', display: 'inline-block', padding: 12, borderRadius: 8 }}>
                <QRCodeSVG value={qrSession.loginUrl} size={180} />
              </div>
              <Text size="xs" c="dimmed" mt="sm">
                The code expires in {qrSession.expiresInSeconds}s and refreshes
                automatically. Approve on your phone to sign in here.
              </Text>
            </div>
          ) : (
          <Stepper
            active={active}
            styles={{
              steps: { display: 'none' },
            }}
          >
            <Stepper.Step>
              <TextInput
                label="Email"
                placeholder="Email"
                {...form.getInputProps('email')}
              />
              <MantineProvider theme={{ cursorType: 'pointer' }}>
                <Checkbox
                  mt="md"
                  size="xs"
                  label="Remember me"
                  {...form.getInputProps('rememberMe', { type: 'checkbox' })}
                />
              </MantineProvider>
            </Stepper.Step>

            <Stepper.Step>
              <TextInput
                label="Email"
                placeholder="Email"
                disabled={true}
                {...form.getInputProps('email')}
              />
              {orgs.length === 1 && orgs[0].id === 0 ? null : (
                <Select
                  mt="md"
                  label="Organization"
                  placeholder="Select your organization"
                  data={orgs.map((o) => ({
                    value: o.id.toString(),
                    label: o.name,
                  }))}
                  {...form.getInputProps('orgId')}
                />
              )}
              <Text size="xs" c="dimmed" mt="md">
                <IconFingerprint size={14} style={{ verticalAlign: 'text-bottom' }} />{' '}
                Your device will ask for Touch ID, Face ID, or your screen-lock
                PIN.
              </Text>
              <Button
                variant="subtle"
                size="compact-xs"
                mt="xs"
                leftSection={<IconQrcode size={14} />}
                onClick={startQrFallback}
              >
                No passkey on this device? Sign in with your phone
              </Button>
            </Stepper.Step>
          </Stepper>
          )}
        </ActionCard>
        <div className="mt-7 flex gap-5">
          <Button
            variant="outline"
            color="primary"
            className="w-full md:w-auto"
            onClick={onClickRedirectCreateNewApplication}
          >
            Sign Up New Application
          </Button>
        </div>
        </div>
      </div>
    </>
  );
};

export default Login;
