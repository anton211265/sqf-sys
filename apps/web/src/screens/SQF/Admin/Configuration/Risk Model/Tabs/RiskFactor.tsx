import {
  ActionIcon,
  AspectRatio,
  Badge,
  Card,
  Center,
  Divider,
  Progress,
  Text,
} from '@mantine/core';
import { PieChart } from '@mantine/charts';

import { MRT_ColumnDef, MantineReactTable } from 'mantine-react-table';
import RiskConfiguration from '../NewRiskFactor';

import React, { FC, useEffect, useMemo, useState } from 'react';
import { color } from 'constants/color';
import { IconEye } from '@tabler/icons-react';
import classes from '../RiskModelView.module.css';

interface RiskFactorProps {
  riskModelId: string;
  riskModelStatus: string;
  riskModelPieChartdata: any[];
  riskModelRiskWeightProgressPercent: number;
  riskModelRiskFactorData: any[];
  closeWithRefetch: (requiredRefetch: boolean) => void;
}

const RiskFactor: FC<RiskFactorProps> = ({
  riskModelId,
  riskModelStatus,
  riskModelPieChartdata,
  riskModelRiskWeightProgressPercent,
  riskModelRiskFactorData,
  closeWithRefetch,
}) => {
  const [riskWeightProgressPercent, setRiskWeightProgressPercent] = useState(0);
  const [riskFactorData, setriskFactorData] = useState<any[]>([]);

  const [pieChartdata, setPieChartdata] = useState<any[]>([
    { name: '', value: 100, color: 'gray.3' },
  ]);
  const scoringMethodColors: { [key: string]: string } = {
    LABEL_SELECTION: 'blue',
    NUMERIC_SCORING: 'green',
    COUNTRY_SELECTION: 'yellow',
    DROPDOWN_SELECTION: color.GRAPE,
  };

  useEffect(() => {
    setriskFactorData(riskModelRiskFactorData);
    setRiskWeightProgressPercent(riskModelRiskWeightProgressPercent);
    setPieChartdata(riskModelPieChartdata);
  }, [
    riskModelPieChartdata,
    riskModelRiskWeightProgressPercent,
    riskModelRiskFactorData,
  ]);

  const columns: MRT_ColumnDef<any>[] = useMemo(
    () => [
      {
        accessorKey: 'riskFactorName',
        header: 'Risk Factor',
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase', // Converts header text to lowercase
            fontSize: '13px',
            color: color.DARKGREY,
          },
        },
        mantineFilterTextInputProps: {
          placeholder: 'Search by Risk Factor', // Custom placeholder
        },
        enableHiding: false,
      },
      {
        accessorKey: 'weight',
        header: 'Weight',
        enableHiding: false,
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase', // Converts header text to lowercase
            fontSize: '13px',
            color: color.DARKGREY,
          },
        },
        mantineFilterTextInputProps: {
          placeholder: 'Search by Organization Name', // Custom placeholder
        },
        Cell: ({ cell }) => <span>{cell.getValue<string>()}%</span>, // Render the country data in uppercase
      },
      {
        accessorKey: 'scoreMethod',
        header: 'Scoring Method',
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase',
            fontSize: '13px',
            color: color.DARKGREY,
          },
        },
        filterVariant: 'select', // Use a dropdown for filtering
        mantineFilterSelectProps: {
          data: [
            'Numeric Scoring',
            'Label-based Scoring',
            'Dropdown Selection Scoring',
            'Country Selection Scoring',
          ], // Options for the dropdown
          placeholder: 'Search by Scoring Method', // Custom placeholder
        },
        enableHiding: false,
        enableSorting: false,
        Cell: ({ cell }) =>
          cell.getValue<string>() ? (
            <Badge
              color={scoringMethodColors[cell.getValue<string>()]} // Fallback color for unknown personas
              variant="light"
              size="md"
              radius="md"
            >
              {cell.getValue<string>()}
            </Badge>
          ) : (
            '-'
          ), // Render the country data in uppercase
      },
      {
        accessorKey: 'scoreRangeMin',
        header: 'Score Range',
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase', // Converts header text to lowercase
            fontSize: '13px',
            color: color.DARKGREY,
          },
        },
        size: 200,
        mantineFilterTextInputProps: {
          placeholder: 'Search by Score Range', // Custom placeholder
        },
        enableHiding: false,
        Cell: ({ cell, row }) => {
          const scoreMax = row.original.scoreRangeMax;
          return cell.getValue<string>()
            ? cell.getValue<string>() + '-' + scoreMax
            : '-'; // Display contactNumber or dash if null
        },
      },
      {
        accessorKey: 'action',
        header: 'Action',
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase', // Converts header text to lowercase
            fontSize: '13px',
            color: color.DARKGREY,
          },
        },
        size: 150,
        enableColumnFilter: false,
        enableSorting: false,
        enableHiding: false,
        Cell: () => (
          <div>
            <ActionIcon
              variant="filled"
              aria-label="Settings"
              radius="xl"
              color={color.GRAPE}
            >
              <IconEye size={16} stroke={1.5} />
            </ActionIcon>
          </div>
        ),
      },
    ],
    []
  );

  const handleCloseRefetch = (requiredRefetch: boolean) => {
    closeWithRefetch(requiredRefetch);
  };

  const addNewFactor = () => {
    return (
      <RiskConfiguration
        riskModelId={riskModelId as string}
        closeWithRefetch={handleCloseRefetch}
      />
    );
  };

  return (
    <div>
      <div>
        <Text size="sm" fw={700}>
          Risk Factor
        </Text>
        <Text size="sm">
          Enter your risk factor and define the relevant weights accordingly
        </Text>

        <div className="my-5">
          <div className="flex justify-between">
            <Text size="xs">Risk Weight Progress Tracker</Text>
            <Text size="xs">
              {100 - riskWeightProgressPercent}% remaining to complete 🚀
            </Text>
          </div>

          <Progress size="lg" value={riskWeightProgressPercent} />
        </div>

        <div className="py-4">
          <MantineReactTable
            data={riskFactorData}
            columns={columns}
            renderTopToolbarCustomActions={
              riskModelStatus !== 'ARCHIVED' ? addNewFactor : undefined
            }
          />
        </div>
      </div>
      <Divider my="md" />
      <div>
        <div className="pb-5">
          <Text size="sm" fw={700}>
            Risk Score Breakdown
          </Text>
          <Text size="sm">
            Preview the complete breakdown of the risk score to better
            understand the contributing factors
          </Text>
        </div>

        <Card withBorder radius="md">
          <Text fw={700}>Pie Chart</Text>
          <AspectRatio ratio={16 / 9}>
            <Center style={{ width: '100%', height: '380px' }}>
              <PieChart
                className={classes.chartOutline}
                data={pieChartdata}
                strokeWidth={0}
                size={300}
                withLabelsLine
                labelsPosition="outside"
                labelsType="percent"
                withLabels
                withTooltip
                tooltipDataSource="segment"
              />
            </Center>
          </AspectRatio>
        </Card>
      </div>
    </div>
  );
};

export default RiskFactor;
