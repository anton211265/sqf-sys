import { Button, Divider, Flex, Group, NumberInput, Switch, Text } from '@mantine/core';
import { color } from 'constants/color';
import { MantineReactTable, MRT_ColumnDef } from 'mantine-react-table';
import React, { FC, useEffect, useState } from 'react';
import { ThresholdBreachProfileProps } from '../ThresholdBreachProfile';
import axios from 'axios';
import { BASE_URL } from 'constants/constant';
import { notifications } from '@mantine/notifications';

interface ThresholdRule {
  ruleId: number;
  score: number;
  thresholdValue: number | null;
  thresholdLabel: string | null;
  comparisonOperator: string;
  isManualTriggerAllowed: boolean;
}

interface SubParameter {
  subParameterId: number;
  subParameterName: string;
  weight: number;
  rules: ThresholdRule[];
}

interface ParameterData {
  weight: number;
  subParameters: SubParameter[];
}

// Renders one Risk Quantitative Parameter category (Liquidity, Leverage,
// Coverage, Asset Management, Business Stability, or any future category) —
// fully data-driven from however many sub-parameters the backend returns,
// rather than a fixed/hardcoded set per category.
const QuantitativeParameterTab: FC<ThresholdBreachProfileProps> = ({
  mode,
  riskProfileCode,
  riskParameterName,
}) => {
  const [weight, setWeight] = useState<number>(0);
  const [subParameters, setSubParameters] = useState<SubParameter[]>([]);
  const [defaultData, setDefaultData] = useState<ParameterData>({
    weight: 0,
    subParameters: [],
  });

  useEffect(() => {
    fetchRiskProfileParameters();
  }, [riskParameterName]);

  const fetchRiskProfileParameters = () => {
    axios
      .get(
        `${BASE_URL}/risk-operation/api/risk-profile/${riskProfileCode}/parameters?riskQuantitativeParameterName=${riskParameterName}`,
      )
      .then((resp) => {
        const responseData = resp.data.data;
        setWeight(responseData.weight);
        setSubParameters(responseData.subParameters);
        setDefaultData({
          weight: responseData.weight,
          subParameters: responseData.subParameters,
        });
      })
      .catch(() => {
        notifications.show({
          id: `fetch-error-${riskParameterName}`,
          title: 'Error',
          message: `Failed to load ${riskParameterName} parameters.`,
          color: 'red',
          autoClose: 3000,
        });
      });
  };

  const updateSubParameterWeight = (subIndex: number, value: number) => {
    setSubParameters((prev) =>
      prev.map((sp, i) => (i === subIndex ? { ...sp, weight: value } : sp)),
    );
  };

  const updateRuleManualTrigger = (
    subIndex: number,
    ruleIndex: number,
    checked: boolean,
  ) => {
    setSubParameters((prev) =>
      prev.map((sp, i) => {
        if (i !== subIndex) return sp;
        return {
          ...sp,
          rules: sp.rules.map((rule, ri) =>
            ri === ruleIndex
              ? { ...rule, isManualTriggerAllowed: checked }
              : rule,
          ),
        };
      }),
    );
  };

  const onSetToDefaultSettings = () => {
    setWeight(defaultData.weight);
    setSubParameters(defaultData.subParameters);
  };

  const onSaveSettings = () => {
    const apiRequestBody = {
      parameterName: riskParameterName,
      weight,
      subParameters: subParameters.map((sp) => ({
        subParameterName: sp.subParameterName,
        weight: sp.weight,
        rules: sp.rules.map((rule) => ({
          score: rule.score,
          isManualTriggerAllowed: rule.isManualTriggerAllowed,
        })),
      })),
    };

    axios
      .patch(
        `${BASE_URL}/risk-operation/api/risk-profile/${riskProfileCode}/parameters`,
        apiRequestBody,
      )
      .then(() => {
        notifications.show({
          title: 'Success',
          message: `${riskParameterName}: Risk Quantitative Parameters have been updated successfully.`,
          color: 'green',
        });
      })
      .catch((error) => {
        const message =
          error?.response?.data?.message ?? `Failed to update ${riskParameterName}.`;
        notifications.show({
          title: 'Error',
          message: Array.isArray(message) ? message.join(' · ') : message,
          color: 'red',
        });
      });
  };

  const buildColumns = (subIndex: number): MRT_ColumnDef<ThresholdRule>[] => [
    {
      accessorKey: 'score',
      header: 'Score',
      enableHiding: false,
      enableSorting: false,
      mantineTableHeadCellProps: {
        style: { textTransform: 'uppercase', fontSize: '13px', color: color.DARKGREY },
      },
    },
    {
      accessorKey: 'thresholdValue',
      header: 'Threshold',
      enableHiding: false,
      enableSorting: false,
      mantineTableHeadCellProps: {
        style: { textTransform: 'uppercase', fontSize: '13px', color: color.DARKGREY },
      },
      Cell: ({ cell }) => {
        const value = cell.getValue<number | null>();
        return <span>{value !== null && value !== undefined ? value : '-'}</span>;
      },
    },
    {
      accessorKey: 'comparisonOperator',
      header: 'Condition',
      enableHiding: false,
      enableSorting: false,
      mantineTableHeadCellProps: {
        style: { textTransform: 'uppercase', fontSize: '13px', color: color.DARKGREY },
      },
      Cell: ({ cell }) => {
        const value = cell.getValue<string>();
        return <span>{value ? value : '-'}</span>;
      },
    },
    {
      accessorKey: 'isManualTriggerAllowed',
      header: 'Allow For Manual Trigger',
      enableHiding: false,
      enableSorting: false,
      mantineTableHeadCellProps: {
        style: { textTransform: 'uppercase', fontSize: '13px', color: color.DARKGREY },
      },
      Cell: ({ row }) => (
        <Switch
          checked={row.original.isManualTriggerAllowed}
          onChange={(event) =>
            updateRuleManualTrigger(subIndex, row.index, event.currentTarget.checked)
          }
          size="lg"
          onLabel="Yes"
          offLabel="No"
          disabled={mode === 'view'}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-end">
        <Group>
          <Button
            variant="outline"
            disabled={mode === 'view'}
            onClick={onSetToDefaultSettings}
          >
            Set to Default Settings
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={mode === 'view'}
            onClick={onSaveSettings}
          >
            Save
          </Button>
        </Group>
      </div>

      <Flex gap={30}>
        <div>
          <Text fw={700}>Weight(%)</Text>
          <Text>
            This represents the percentage weight assigned to {riskParameterName} in
            the overall risk assessment. A higher weight increases its influence on
            the final risk score.
          </Text>
        </div>
        <div className="min-w-[722px]">
          <NumberInput
            decimalScale={2}
            allowNegative={false}
            allowDecimal={false}
            label="Weight(%)"
            mb={10}
            value={weight}
            onChange={(value) => setWeight(value as number)}
            disabled={mode === 'view'}
          />
        </div>
      </Flex>

      {subParameters.map((sub, subIndex) => (
        <React.Fragment key={sub.subParameterId}>
          <Divider my="md" />
          <Flex gap={30}>
            <div>
              <Text fw={700}>{sub.subParameterName}</Text>
            </div>

            <div>
              <NumberInput
                decimalScale={2}
                allowNegative={false}
                allowDecimal={false}
                label="Weight(%)"
                mb={20}
                value={sub.weight}
                onChange={(value) => updateSubParameterWeight(subIndex, value as number)}
                disabled={mode === 'view'}
              />

              <Text mb={10}>Configurable Risk Thresholds & Manual Review Triggers</Text>
              <MantineReactTable
                data={sub.rules}
                columns={buildColumns(subIndex)}
                enableTopToolbar={false}
              />
            </div>
          </Flex>
        </React.Fragment>
      ))}
    </div>
  );
};

export default QuantitativeParameterTab;
