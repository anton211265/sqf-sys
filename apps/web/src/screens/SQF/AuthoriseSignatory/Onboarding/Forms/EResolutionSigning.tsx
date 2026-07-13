import { IconPencil } from '@tabler/icons-react';
import React from 'react';
import { OnboardingHeaderCard } from 'components/SQF/BaseComponents/OnboardingHeaderCard';
import { Button } from '@mantine/core';
import { color } from 'constants/color';

interface Props {
  setNextActiveSteps: () => void;
}

export const EResolutionSigning: React.FC<Props> = ({ setNextActiveSteps }) => {
  const onClickFinishSigningResolution = () => {
    setNextActiveSteps();

    // TODO: need to have success notifications displayed
  };

  return (
    <div className="flex flex-col justify-center items-center mt-7 mx-10">
      <OnboardingHeaderCard
        title="e-Resolution Signing"
        description="Review and sign your documents electronically."
        Icon={IconPencil}
      ></OnboardingHeaderCard>

      <div className="flex flex-col w-full">
        <div className="border-2 border-zinc-200 rounded-md p-9 mt-5">
          Aggreement
        </div>
        <div className="self-end mb-5">
          <Button
            type="submit"
            variant="primary"
            className="w-full md:w-auto"
            style={{
              color: '#ffffff',
              backgroundColor: color.DARKBLUE,
              marginTop: '30px',
            }}
            onClick={onClickFinishSigningResolution}
          >
            Save & continue
          </Button>
        </div>
      </div>
    </div>
  );
};
