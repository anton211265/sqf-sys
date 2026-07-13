import React from 'react';
import { Button, Image } from '@mantine/core';
import OnboardingCompleted from 'assets/img/onboarding-completed-tasks.svg';
import { CLIENTONBOARDING } from 'constants/routes';
import { useNavigate } from 'react-router-dom';
import { color } from 'constants/color';

const ClientOnboardingCompleted = () => {
  const navigate = useNavigate();

  // Redirected to Client OB Step 1
  const onClickDone = () => {
    navigate(CLIENTONBOARDING.INREVIEW);
  };

  return (
    <div className="h-screen flex justify-center">
      <div className="mt-7 mr-7 ml-7 px-5 flex flex-col justify-center items-center">
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
          <h1 className="font-bold text-2xl mt-3 mb-2">Onboarding completed</h1>
          <p className="">
            Congratulations! You’ve successfully completed the onboarding
            process. The final step is for the authorised signatory to complete
            identity verification. Please have them follow the necessary steps
            to finish this process.
          </p>
          <p className="mt-6">
            We’ll review everything and reach out to you shortly.{' '}
          </p>
          <p>Thank you for choosing SQF.AI!</p>
        </div>
        <div className="flex self-center">
          <Button
            variant="primary"
            className="w-full md:w-auto"
            style={{
              color: '#ffffff',
              backgroundColor: color.GOLD,
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

export default ClientOnboardingCompleted;
