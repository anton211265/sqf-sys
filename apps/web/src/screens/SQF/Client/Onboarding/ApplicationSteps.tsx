import { useState } from 'react';
import React from 'react';
import { Stepper, Button, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconPower,
  IconReport,
  IconBuilding,
  IconUsers,
  IconRocket,
} from '@tabler/icons-react';
import KycReportConsentForm from 'screens/SQF/Client/Onboarding/Forms/KycReportConsentForm';
import BusinessProfileForm from 'screens/SQF/Client/Onboarding/Forms/BusinessProfileForm';
import RepresentativeDetailsForm from 'screens/SQF/Client/Onboarding/Forms/RepresentativeDetailsForm';
import OnboardingCompleted from 'screens/SQF/Client/Onboarding/Completed';
import { color } from 'constants/color';
import { useNavigate } from 'react-router-dom';
import useLogout from 'hooks/useLogout';
import { AUTH } from 'constants/routes';
import { notifications } from '@mantine/notifications';

const ApplicationSteps = () => {
  const navigate = useNavigate();
  const logoutMuation = useLogout();
  const [active, setActive] = useState(0);

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
              color={color.GOLD}
              // allowNextStepsSelect={false}
            >
              <Stepper.Step
                label="Consent to Business Credit Check"
                description="Get your business's credit report from a registered credit reporting (KYC) agency."
                icon={
                  <IconReport
                    style={{ width: '20px', height: '20px', color: color.GOLD }}
                  />
                }
                // allowStepSelect={false}
              />
              <Stepper.Step
                label="Business Profile"
                description="Enter your business details."
                icon={
                  <IconBuilding
                    style={{ width: '20px', height: '20px', color: color.GOLD }}
                  />
                }
                // allowStepSelect={false}
              />
              <Stepper.Step
                label="Representative Details"
                description="Provide your representative's information."
                icon={
                  <IconUsers
                    style={{ width: '20px', height: '20px', color: color.GOLD }}
                  />
                }
                // allowStepSelect={false}
              />
              <Stepper.Step
                label="Welcome to SQF.AI!"
                description="You're all set! Welcome aboard."
                icon={
                  <IconRocket
                    style={{ width: '20px', height: '20px', color: color.GOLD }}
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
          {/* Step 1: Request for KYC report */}
          {active === 0 && (
            <KycReportConsentForm setNextActiveSteps={nextStep} />
          )}

          {/* Step 2: Business Profile*/}
          {active === 1 && (
            <BusinessProfileForm setNextActiveSteps={nextStep} />
          )}

          {/* Step 3: Representative Details*/}
          {active === 2 && (
            <RepresentativeDetailsForm setNextActiveSteps={nextStep} />
          )}

          {/* Client Onboarding Completed */}
          {active === 3 && <OnboardingCompleted />}
        </div>
      </div>
    </div>
  );
};

export default ApplicationSteps;
