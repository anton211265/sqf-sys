import React from 'react';
import ClientOnboardingImage from 'assets/img/client-onboarding-welcome.svg';
import { Button, Image } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { color } from 'constants/color';
import { useNavigate } from 'react-router-dom';
import { CLIENTONBOARDING } from 'constants/routes';

const ClientWelcome = () => {
  const navigate = useNavigate();

  // Redirected to Client OB Step 1
  const onClickLetsGetStarted = () => {
    navigate(CLIENTONBOARDING.APPLICATIONSTEPS);
  };

  return (
    <div className="flex flex-col">
      <h1 className="mt-2 font-extrabold text-4xl text-center sm:text-left">
        Start your journey with us.
      </h1>
      <p className="mt-2 text-center sm:text-left">
        Our onboarding process is quick and easy, taking no more than 10 minutes
        to complete. We’re here to make the process smooth and easy.
      </p>
      <div className="self-center sm:self-start">
        <Button
          variant="primary"
          className="w-full md:w-auto"
          style={{
            color: '#ffffff',
            backgroundColor: color.GOLD,
            marginTop: '30px',
          }}
          rightSection={<IconArrowRight size={14} />}
          onClick={onClickLetsGetStarted}
        >
          Let's get started
        </Button>
      </div>
      <div className="mt-4 w-full flex justify-center sm:justify-end">
        <Image
          radius="md"
          h="auto"
          w={{ base: 250, sm: 350, md: 390 }}
          fit="contain"
          src={ClientOnboardingImage}
          alt="Illustration"
        />
      </div>
    </div>
  );
};

export default ClientWelcome;
