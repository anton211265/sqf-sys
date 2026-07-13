import {
  IconCheck,
  IconLockAccess,
  IconShieldCheck,
  IconX,
} from '@tabler/icons-react';
import ActionCard from 'components/SQF/BaseComponents/ActionCard';
import React, { useEffect, useState } from 'react';
import { Box, PasswordInput, Popover, Progress, Text } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { AUTH } from 'constants/routes';
import useResetPasswordToken from 'hooks/useResetPasswordToken';
import { notifications } from '@mantine/notifications';

function PasswordRequirement({
  meets,
  label,
}: {
  meets: boolean;
  label: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Text c={meets ? 'teal' : 'red'} size="sm">
        {meets ? <IconCheck size={14} /> : <IconX size={14} />}
      </Text>
      <Text c={meets ? 'teal' : 'red'} ml={10}>
        {label}
      </Text>
    </div>
  );
}

const requirements = [
  { re: /[0-9]/, label: 'Includes number' },
  { re: /[a-z]/, label: 'Includes lowercase letter' },
  { re: /[A-Z]/, label: 'Includes uppercase letter' },
  { re: /[$&+,:;=?@#|'<>.^*()%!-]/, label: 'Includes special symbol' },
];

function getStrength(password: string) {
  let multiplier = password.length > 7 ? 0 : 1;

  requirements.forEach((requirement) => {
    if (!requirement.re.test(password)) {
      multiplier += 1;
    }
  });

  return Math.max(100 - (100 / (requirements.length + 1)) * multiplier, 10);
}

const SetupNewPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenvalue, setTokenValue] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const resetPasswordTokenMutation = useResetPasswordToken();

  const [popoverOpened, setPopoverOpened] = useState(false);
  const checks = requirements.map((requirement, index) => (
    <PasswordRequirement
      key={index}
      label={requirement.label}
      meets={requirement.re.test(password)}
    />
  ));

  const strength = getStrength(password);
  const color = strength === 100 ? 'teal' : strength > 50 ? 'yellow' : 'red';

  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      const cleanedToken = token.replace(/^"(.*)"$/, '$1');
      setTokenValue(cleanedToken);
    }
  }, []);

  const handleSavePassword = () => {
    setIsLoading(true);

    resetPasswordTokenMutation.mutate(
      {
        token: tokenvalue,
        password: password,
        confirmPassword: confirmPassword,
      },
      {
        onSuccess: () => {
          setIsSuccess(true);
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
        onSettled: () => {
          setIsLoading(false);
        },
      }
    );
  };

  const onClickRedirectToLoginPage = () => {
    navigate(AUTH.LOGIN);
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-zinc-100">
        <ActionCard
          title={
            isSuccess
              ? 'Password Reset Successful! 🎉'
              : 'Set Your New Password'
          }
          description={
            isSuccess
              ? 'Your new password has been set. You can now use it to log in to your account.'
              : 'Enter a new password to enhance the security of your account.'
          }
          Icon={isSuccess ? IconShieldCheck : IconLockAccess}
          primaryButtonLabel={isSuccess ? 'Return to Login' : 'Save Password'}
          onClickPrimaryButtonAction={
            isSuccess ? onClickRedirectToLoginPage : handleSavePassword
          }
          loading={isLoading}
          primaryButtonDisabled={
            password == '' ||
            confirmPassword == '' ||
            password !== confirmPassword ||
            strength !== 100
          }
        >
          {!isSuccess && (
            <form>
              <div className="grid grid-cols-1">
                <div className="col-span-full">
                  <Popover
                    opened={popoverOpened}
                    position="bottom"
                    width="target"
                    transitionProps={{ transition: 'pop' }}
                  >
                    <Popover.Target>
                      <div
                        onFocusCapture={() => setPopoverOpened(true)}
                        onBlurCapture={() => setPopoverOpened(false)}
                      >
                        <PasswordInput
                          label="Password"
                          size="xs"
                          styles={{
                            label: { fontWeight: 250 },
                            input: { fontWeight: 400 },
                          }}
                          value={password}
                          onChange={(event) =>
                            setPassword(event.currentTarget.value)
                          }
                        />
                      </div>
                    </Popover.Target>
                    <Popover.Dropdown>
                      <Progress
                        color={color}
                        value={strength}
                        size={5}
                        mb="xs"
                      />
                      <PasswordRequirement
                        label="Includes at least 8 characters"
                        meets={password.length > 7}
                      />
                      {checks}
                    </Popover.Dropdown>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-1 mt-4">
                <div className="col-span-full">
                  <PasswordInput
                    label="Confirm Password"
                    size="xs"
                    styles={{
                      label: { fontWeight: 250 },
                      input: { fontWeight: 400 },
                    }}
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.currentTarget.value)
                    }
                  />
                </div>
              </div>
            </form>
          )}
        </ActionCard>
      </div>
    </>
  );
};

export default SetupNewPassword;
