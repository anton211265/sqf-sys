import { IconMeteor } from '@tabler/icons-react';
import ActionCard from 'components/SQF/BaseComponents/ActionCard';
import React, { FC, useEffect, useState } from 'react';
import TextInput from 'components/TextBox/TextBox';
import {
  Button,
  Checkbox,
  MantineProvider,
  PasswordInput,
  Select,
  Stepper,
} from '@mantine/core';
import { color } from 'constants/color';
import { useNavigate } from 'react-router-dom';
import { ADMIN, CLIENT_DASHBOARD, CLIENTONBOARDING, SUPER_ADMIN, SYSTEM } from 'constants/routes';
import { OrganizationPersonRoleEnum } from 'constants/enum';
import { useForm } from '@mantine/form';
import useGetOrgsByEmail from 'hooks/useGetOrgsByEmail';
import { notifications } from '@mantine/notifications';
import { IGetOrgsByEmailResponse } from 'service/getOrgsByEmail';
import useLogin from 'hooks/useLogin';
import { useLocalStorage } from '@mantine/hooks';
import useGetLogInPersonDetail from 'hooks/useGetLogInPersonDetail';
import { useDispatch } from 'react-redux';
import { setData } from '../../../redux/user';
import { getAccessToken } from '../../../api/axiosClient';

const Login: FC = () => {
  const [savedEmail, setSavedEmail] = useLocalStorage({
    key: 'rememberedEmail',
    defaultValue: '',
  });
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const orgsMutation = useGetOrgsByEmail();
  const [orgs, setOrgs] = useState<IGetOrgsByEmailResponse[]>([]);
  const loginMutation = useLogin();
  const { data, error, isLoading, refetch: refetchMe } = useGetLogInPersonDetail();
  const dispatch = useDispatch();

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
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
          password: values.password ? null : 'Invalid password',
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

  const handleLogin = () => {
    const { email, password, orgId } = form.values;

    loginMutation.mutate(
      { email, password, orgId: parseInt(orgId) },
      {
        onSuccess: () => {
          if (orgs.length === 1 && orgs[0].id === 0) {
            navigate(SYSTEM.SETUP);
            return;
          }
          refetchMe();
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

  const nextStep = () => {
    if (form.validate().hasErrors) {
      return;
    }

    if (active === 0) {
      handleGetOrgs();
    }

    if (active === 1) {
      handleLogin();
    }
  };

  const prevStep = () => {
    setActive(0);
  };

  const onClickRedirectCreateNewApplication = () => {
    navigate(CLIENTONBOARDING.NEWAPPLICATION);
  };

  const onClickRedirectToWelcomePage = () => {
    navigate(CLIENTONBOARDING.WElCOMEPAGE);
  };

  const onClickRedirectToConfigureRisk = () => {
    navigate(ADMIN.ADD_RISK);
  };

  return (
    <>
      <div className="flex items-center justify-center flex-col min-h-screen bg-zinc-100">
        <ActionCard
          title={'Welcome back ! 🎉'}
          description={'Enter your details to sign in to your account'}
          Icon={IconMeteor}
          primaryButtonLabel="Login"
          onClickPrimaryButtonAction={nextStep}
          onClickSecondaryButtonAction={prevStep}
          secondaryButtonLabel={active !== 0 ? 'Back' : ''}
          loading={orgsMutation.isLoading || loginMutation.isLoading}
        >
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
              <PasswordInput
                mt="md"
                label="Password"
                placeholder="Password"
                {...form.getInputProps('password')}
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
            </Stepper.Step>
          </Stepper>
        </ActionCard>
        <div className="mt-7 flex gap-5">
          <Button
            variant="primary"
            className="w-full md:w-auto"
            style={{
              color: '#ffffff',
              backgroundColor: color.GOLD,
            }}
            onClick={onClickRedirectCreateNewApplication}
          >
            Sign Up New Application
          </Button>
        </div>
      </div>
    </>
  );
};

export default Login;
