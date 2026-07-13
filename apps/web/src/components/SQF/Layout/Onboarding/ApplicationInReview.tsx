import React, { ReactNode } from 'react';
import { Button } from '@mantine/core';
import { IconPower } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import useLogout from 'hooks/useLogout';
import { AUTH } from 'constants/routes';
import { notifications } from '@mantine/notifications';

interface LayoutProps {
  children: ReactNode;
  onButtonClick: () => void;
  persona?: string;
}

const ApplicationInReviewLayout: React.FC<LayoutProps> = ({
  children,
  onButtonClick,
  persona,
}) => {
  const navigate = useNavigate();
  const logoutMuation = useLogout();
  let bgColor = '';

  if (persona === 'client') {
    bgColor =
      'linear-gradient(171deg, rgba(255,255,255,1) 0%, rgba(176,162,117,1) 90%)';
  } else if (persona === 'authorise-signatory') {
    bgColor =
      'linear-gradient(171deg, rgba(255,255,255,1) 0%, rgba(4,23,75,1) 90%)';
  }

  const handleLogout = () => {
    logoutMuation.mutate(undefined, {
      onSuccess: () => {
        navigate(AUTH.LOGIN);
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
    });
  };

  return (
    <div className="min-h-screen flex p-7" style={{ background: bgColor }}>
      <div className="w-full md:w-1/2 flex flex-col">
        <h1 className="p-7 font-bold">Client Portal</h1>
        <div className="flex-1 px-7">{children}</div>
        <div className="py-7 px-5 flex justify-center sm:justify-start">
          <Button
            variant="subtle"
            className="w-full md:w-auto"
            style={{
              color: 'black',
              backgroundColor: 'white',
            }}
            leftSection={<IconPower size={16} />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>
      <div className="w-0 md:w-1/2"></div>
    </div>
  );
};

export default ApplicationInReviewLayout;
