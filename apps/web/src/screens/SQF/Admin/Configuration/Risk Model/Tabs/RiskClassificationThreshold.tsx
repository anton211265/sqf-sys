import {
  ActionIcon,
  Button,
  Divider,
  Group,
  NumberInput,
  RangeSlider,
  Text,
} from '@mantine/core';
import axios from 'axios';
import { BASE_URL } from 'constants/constant';
import { notifications } from '@mantine/notifications';
import React, { FC, useEffect, useState } from 'react';
import { IconPencil } from '@tabler/icons-react';

interface RiskClassificationThresholdProps {
  riskModelId: string;
  riskModelLowRiskThresholds: [number, number];
  riskModelMediumRiskThresholds: [number, number];
  riskModelHighRiskThresholds: [number, number];
  riskModelStatus: string;
}
const RiskClassificationThreshold: FC<RiskClassificationThresholdProps> = ({
  riskModelId,
  riskModelLowRiskThresholds,
  riskModelMediumRiskThresholds,
  riskModelHighRiskThresholds,
  riskModelStatus,
}) => {
  const [editMode, setEditMode] = useState<boolean>(false);

  const [lowRiskThresholds, setLowRiskThresholds] = useState<[number, number]>([
    0, 0,
  ]);
  const [mediumRiskThresholds, setMediumRiskThresholds] = useState<
    [number, number]
  >([0, 0]);
  const [highRiskThresholds, setHighRiskThresholds] = useState<
    [number, number]
  >([0, 0]);

  useEffect(() => {
    setLowRiskThresholds(riskModelLowRiskThresholds);
    setMediumRiskThresholds(riskModelMediumRiskThresholds);
    setHighRiskThresholds(riskModelHighRiskThresholds);
  }, [
    riskModelLowRiskThresholds,
    riskModelMediumRiskThresholds,
    riskModelHighRiskThresholds,
  ]);

  const updateEditMode = () => {
    setEditMode(!editMode);
  };

  const onCancelEditMode = () => {
    setEditMode(false);
  };

  const onSaveRiskThresholds = () => {
    const payLoad = {
      minLow: lowRiskThresholds[0],
      maxLow: lowRiskThresholds[1],
      minMedium: mediumRiskThresholds[0],
      maxMedium: mediumRiskThresholds[1],
      minHigh: highRiskThresholds[0],
      maxHigh: highRiskThresholds[1],
    };
    try {
      axios
        .patch(
          `${BASE_URL}/risk-operation/api/risk-model/${riskModelId}/risk-thresholds`,
          payLoad
        )
        .then((resp) => {
          const data = resp.data.data;

          setLowRiskThresholds(data.lowRiskThresholds);
          setMediumRiskThresholds(data.mediumRiskThresholds);
          setHighRiskThresholds(data.highRiskThresholds);
        });
    } catch (error) {
      console.error(
        `Error fetching risk thresholds data for ID: ${riskModelId}:`,
        error
      );

      // Show error notification (with "once" to prevent duplication)
      notifications.show({
        id: 'fetch-error', // Unique ID to ensure it displays only once
        title: 'Error',
        message: 'Failed to fetched risk thresholds',
        color: 'red',
        autoClose: 2000,
      });
    }
    setEditMode(false);
  };
  return (
    <div>
      <div className="pb-5">
        <div className="flex justify-between items-center">
          <div>
            <Text size="sm" fw={700}>
              Risk Classification Thresholds
            </Text>
            <Text size="sm">
              Define the minimum and maximum thresholds for each risk
              classification
            </Text>
          </div>
          {!editMode && riskModelStatus !== 'ARCHIVED' && (
            <div>
              <ActionIcon
                variant="subtle"
                color="gray"
                radius="xl"
                onClick={() => updateEditMode()}
              >
                <IconPencil size={20} />
              </ActionIcon>
            </div>
          )}
        </div>
      </div>
      <div>
        <Text size="sm" mb={18} fw={700}>
          Low Risk
        </Text>

        <div className="flex">
          <NumberInput
            label="Min"
            min={10}
            max={20}
            value={lowRiskThresholds[0]}
            disabled={!editMode}
          />
          <div className="pt-5 px-5 content-center">-</div>

          <NumberInput
            label="Max"
            min={10}
            max={20}
            value={lowRiskThresholds[1]}
            disabled={!editMode}
          />
        </div>
        <div className="py-5">
          {lowRiskThresholds[1] !== 0 && (
            <RangeSlider
              minRange={1}
              min={0}
              max={100}
              step={1}
              defaultValue={lowRiskThresholds}
              disabled={!editMode}
              color="rgba(24, 161, 83, 1)"
              onChange={setLowRiskThresholds}
            />
          )}
        </div>
      </div>
      <Divider my="md" />
      <div>
        <Text size="sm" mb={18} fw={700}>
          Medium Risk
        </Text>

        <div className="flex">
          <NumberInput
            label="Min"
            min={10}
            max={20}
            value={mediumRiskThresholds[0]}
            disabled={!editMode}
          />
          <div className="pt-5 px-5 content-center">-</div>

          <NumberInput
            label="Max"
            min={10}
            max={20}
            value={mediumRiskThresholds[1]}
            disabled={!editMode}
          />
        </div>
        <div className="py-5">
          {mediumRiskThresholds[0] !== 0 && (
            <RangeSlider
              minRange={1}
              min={0}
              max={100}
              step={1}
              defaultValue={mediumRiskThresholds}
              disabled={!editMode}
              color="rgba(255, 188, 36, 1)"
              onChange={setMediumRiskThresholds}
            />
          )}
        </div>
      </div>
      <Divider my="md" />
      <div>
        <Text size="sm" mb={18} fw={700}>
          High Risk
        </Text>

        <div className="flex">
          <NumberInput
            label="Min"
            min={10}
            max={20}
            value={highRiskThresholds[0]}
            disabled={!editMode}
          />
          <div className="pt-5 px-5 content-center">-</div>

          <NumberInput
            label="Max"
            min={10}
            max={20}
            value={highRiskThresholds[1]}
            disabled={!editMode}
          />
        </div>
        <div className="py-5">
          {highRiskThresholds[0] !== 0 && (
            <RangeSlider
              minRange={1}
              min={0}
              max={100}
              step={1}
              defaultValue={highRiskThresholds}
              disabled={!editMode}
              color="rgba(203, 60, 51, 1)"
              onChange={setHighRiskThresholds}
            />
          )}
        </div>
      </div>

      {editMode && (
        <div className="flex justify-end">
          <Group mt="lg">
            <Button
              onClick={onCancelEditMode}
              variant="outline"
              color="myColor"
            >
              Cancel
            </Button>
            <Button onClick={onSaveRiskThresholds} variant="primary">
              Save changes
            </Button>
          </Group>
        </div>
      )}
    </div>
  );
};

export default RiskClassificationThreshold;
