import {
  ActionIcon,
  Center,
  Flex,
  Group,
  NumberFormatter,
  Paper,
  Stack,
  Text,
} from '@mantine/core';
import React, { FC, useEffect, useState } from 'react';
import { IconCoin, IconSettingsAutomation } from '@tabler/icons-react';
import { LineChart } from '@mantine/charts';
import { formatDateMMMYY } from 'service/formatDate';

export interface FinancialCreditReportProps {
  financialCreditReportData: any[];
  assetManagement?: any[];
  liquidityMeasures?: any[];
  leverage?: any[];
  coverage?: any[];
}

const BusinessStability: FC<FinancialCreditReportProps> = ({
  financialCreditReportData,
}) => {
  const [yearOfOperation, setYearOfOperation] = useState(0);
  const [profitiability, setProfitiability] = useState('-');
  const [totalRevenue, setTotalRevenue] = useState('');
  const [netRevenue, setNetRevenue] = useState('');
  const [netProfit, setNetProfit] = useState('');

  const [reportInitialDate, setReportInitialDate] = useState('');
  const [reportLatestDate, setReportLatestDate] = useState('');

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!financialCreditReportData || financialCreditReportData.length === 0) {
      return;
    }

    const yearOfOperation = financialCreditReportData[0]['yearsOfOperation'];
    const profitability = financialCreditReportData[0]['profitability'];
    const totalRevenue = financialCreditReportData[0]['totalRevenue'];
    const netRevenue = financialCreditReportData[0]['netRevenue'];
    const netProfit = financialCreditReportData[0]['netProfit'];

    const reportDateLatest = financialCreditReportData[0]['reportDate'];

    const reportDateInitial = financialCreditReportData[2]['reportDate'];

    const formatReportDateLatest = formatDateMMMYY(reportDateLatest, '4');
    const formatReportDateInitial = formatDateMMMYY(reportDateInitial, '4');

    const chartDataArray = financialCreditReportData.reverse().map((item) => ({
      date: formatDateMMMYY(item['reportDate']),
      Revenue: Number(item['totalRevenue']),
    }));

    setChartData(chartDataArray);

    setReportInitialDate(formatReportDateInitial);
    setReportLatestDate(formatReportDateLatest);

    setYearOfOperation(yearOfOperation);
    setProfitiability(profitability);
    setTotalRevenue(totalRevenue);
    setNetRevenue(netRevenue);
    setNetProfit(netProfit);
  }, [financialCreditReportData]);

  return (
    <div>
      <Flex gap="md">
        <Paper shadow="sm" p="lg" radius="md">
          <Text fw={700} size="xs" mb={12}>
            Business Stability
          </Text>

          <Flex justify="space-between" mb="md" gap="md">
            <Flex>
              <ActionIcon variant="light" aria-label="Settings" mr={10}>
                <IconSettingsAutomation
                  style={{ width: '70%', height: '70%' }}
                  stroke={1.5}
                />
              </ActionIcon>

              <Text size="xs">Years of Operation</Text>
            </Flex>

            <Text fw={700} size="xs">
              {yearOfOperation} years
            </Text>
          </Flex>

          <Group justify="space-between">
            <Flex>
              <ActionIcon variant="light" aria-label="Settings" mr={10}>
                <IconCoin
                  style={{ width: '70%', height: '70%' }}
                  stroke={1.5}
                />
              </ActionIcon>

              <Text size="xs">Profitability</Text>
            </Flex>

            <Text fw={700} size="xs">
              {profitiability}
            </Text>
          </Group>
        </Paper>

        <Paper shadow="sm" p="lg" radius="md" className="flex-1 min-w-[500px]">
          <Text fw={700} size="xs">
            Revenue Trends Over Time
          </Text>
          <Flex>
            <LineChart
              h={300}
              data={chartData}
              dataKey="date"
              withLegend
              xAxisLabel="Years of Operation"
              yAxisLabel="Revenue ($K)"
              series={[{ name: 'Revenue', color: 'blue.6' }]}
            />

            <Center>
              <Stack gap="md" p={25}>
                <Text fw={700} size="lg">
                  Total Revenue:
                </Text>
                <Text fw={700} c="rgba(255,196,163,1)" size="lg">
                  <NumberFormatter
                    prefix="$"
                    value={totalRevenue}
                    thousandSeparator
                  />
                </Text>

                <Text fw={700} c="rgba(161,161,170,1)" size="lg">
                  From {reportInitialDate} to {reportLatestDate}
                </Text>

                <Flex gap={22}>
                  <Flex gap={5}>
                    <div className="bg-[#EEBEFA] rounded-sm min-w-[10px] h-[10px] mt-1"></div>
                    <div>
                      <Text size="xs">
                        <NumberFormatter
                          prefix="$"
                          value={netProfit}
                          thousandSeparator
                        />
                      </Text>
                      <Text fw={700} size="xs">
                        Net Profit
                      </Text>
                    </div>
                  </Flex>
                  <Flex gap={5}>
                    <div className="bg-[#A0E7E5] rounded-sm min-w-[10px] h-[10px] mt-1"></div>
                    <div>
                      <Text size="xs">
                        <NumberFormatter
                          prefix="$"
                          value={netRevenue}
                          thousandSeparator
                        />
                      </Text>
                      <Text fw={700} size="xs">
                        Net Revenue
                      </Text>
                    </div>
                  </Flex>
                </Flex>
              </Stack>
            </Center>
          </Flex>
        </Paper>
      </Flex>
    </div>
  );
};

export default BusinessStability;
