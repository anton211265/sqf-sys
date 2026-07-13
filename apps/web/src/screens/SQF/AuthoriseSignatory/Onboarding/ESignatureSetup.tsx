import { useState } from 'react';
import React from 'react';
import { Stepper, Button } from '@mantine/core';
import {
  IconPower,
  IconRocket,
  IconCloudUpload,
  IconPencil,
} from '@tabler/icons-react';
import { UploadESignature } from 'screens/SQF/AuthoriseSignatory/Onboarding/Forms/UploadESignature';
import { EResolutionSigning } from 'screens/SQF/AuthoriseSignatory/Onboarding/Forms/EResolutionSigning';
import { color } from 'constants/color';
import AuthoriseSignatoryCompleted from './Completed';
import { useNavigate } from 'react-router-dom';
import useLogout from 'hooks/useLogout';
import { AUTH } from 'constants/routes';
import { notifications } from '@mantine/notifications';

export const AuthoriseSignatoryESignatureSetup = () => {
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const logoutMuation = useLogout();

  const nextStep = () =>
    setActive((current) => {
      return current < 3 ? current + 1 : current;
    });

  const prevStep = () =>
    setActive((current) => (current > 0 ? current - 1 : current));

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
    <div>
      <div className="h-screen flex">
        <div className="bg-zinc-200 w-96 mt-7 mb-7 ml-7 rounded-lg flex flex-col border-zinc-300 shadow-md">
          <h1 className="p-7 font-bold">Client Portal</h1>
          <div className="px-7 py-10 flex-1">
            <Stepper
              active={active}
              onStepClick={setActive}
              orientation="vertical"
              size="sm"
              color={color.DARKBLUE}
              allowNextStepsSelect={false}
            >
              <Stepper.Step
                label="Upload e-signature"
                description="Upload your signature image for future use."
                icon={
                  <IconCloudUpload
                    style={{
                      width: '20px',
                      height: '20px',
                      color: color.DARKBLUE,
                    }}
                  />
                }
                allowStepSelect={false}
              />
              <Stepper.Step
                label="e-Resolution Signing"
                description="Review and sign your documents electronically."
                icon={
                  <IconPencil
                    style={{
                      width: '20px',
                      height: '20px',
                      color: color.DARKBLUE,
                    }}
                  />
                }
                allowStepSelect={false}
              />
              <Stepper.Step
                label="Welcome to SQF.AI!"
                description="You're all set! Welcome aboard."
                icon={
                  <IconRocket
                    style={{
                      width: '20px',
                      height: '20px',
                      color: color.DARKBLUE,
                    }}
                  />
                }
              />
            </Stepper>
          </div>
          <div></div>
          <div className="py-7 px-5">
            <Button
              variant="primary"
              className="w-full md:w-auto"
              style={{
                color: 'black',
                backgroundColor: 'transparent',
              }}
              leftSection={<IconPower size={16} />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-scroll">
          {/* Step 1: Upload e-signature */}
          {active === 0 && <UploadESignature setNextActiveSteps={nextStep} />}

          {/* Step 2: E-Resolution Signing */}
          {active === 1 && <EResolutionSigning setNextActiveSteps={nextStep} />}

          {/* Signatory Onboarding Completed */}
          {active === 2 && <AuthoriseSignatoryCompleted />}
        </div>
      </div>
    </div>
  );
};
