import React from 'react';
import { Button, Image } from '@mantine/core';
import OnboardingCompleted from 'assets/img/authorise-signatory-onboarding-completed.svg';
import { color } from 'constants/color';
import { useNavigate } from 'react-router-dom';
import { AUTHORISESIGNATORY } from 'constants/routes';

const AuthoriseSignatoryCompleted = () => {
  const navigate = useNavigate();

  const onClickDone = () => {
    navigate(AUTHORISESIGNATORY.INREVIEW);
  };

  return (
    <div className="h-screen flex">
      <div className="flex-1 overflow-scroll mt-7 mr-7 ml-7 px-5 flex flex-col justify-center items-center">
        <div>
          <Image
            radius="md"
            h={150}
            w="auto"
            fit="contain"
            src={OnboardingCompleted}
          />
        </div>
        <div className="text-xs text-center md:px-20 leading-loose">
          <h1 className="font-bold text-2xl mt-3 mb-2">Setup completed</h1>
          <p className="">
            Thank you for verifying your identity as the authorized signatory
            and signing the e-resolution. We will proceed to review your
            company’s application and get in touch with you soon.
          </p>
          <p className="mt-6">Thank you for choosing SQF.AI!</p>
        </div>
        <div className="flex self-center">
          <Button
            variant="primary"
            className="w-full md:w-auto"
            style={{
              color: '#ffffff',
              backgroundColor: color.DARKBLUE,
              marginTop: '30px',
            }}
            onClick={onClickDone}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuthoriseSignatoryCompleted;
