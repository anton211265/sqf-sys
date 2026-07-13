import React from 'react';
import SignContract from 'assets/img/authorise-signatory-onboarding-welcome.svg';
import { Button, Image } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { color } from 'constants/color';
import { useNavigate } from 'react-router-dom';
import { AUTHORISESIGNATORY } from 'constants/routes';

const AuthoriseSignatoryWelcome = () => {
  const navigate = useNavigate();

  const onClickLetsGetStarted = () => {
    navigate(AUTHORISESIGNATORY.ESIGNATURESETUP);
  };

  return (
    <div className="flex flex-col">
      <h1 className="mt-2 font-extrabold text-4xl text-center sm:text-left">
        Easy setup for secure signing.
      </h1>
      <p className="mt-2 text-center sm:text-left">
        Save time by setting up your e-signature now. This one-time setup allows
        you to sign future documents quickly and securely.
      </p>
      <div className="self-center sm:self-start">
        <Button
          variant="primary"
          className="w-full md:w-auto"
          style={{
            color: '#ffffff',
            backgroundColor: color.DARKBLUE,
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
          src={SignContract}
          alt="Illustration"
        />
      </div>
    </div>
  );
};

export default AuthoriseSignatoryWelcome;
