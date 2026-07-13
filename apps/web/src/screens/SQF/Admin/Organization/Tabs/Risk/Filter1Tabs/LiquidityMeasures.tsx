import {
  ActionIcon,
  Center,
  Divider,
  Flex,
  Group,
  NumberFormatter,
  Paper,
  Stack,
  Text,
} from '@mantine/core';
import React, { FC, useEffect, useState } from 'react';
import { IconChartHistogram } from '@tabler/icons-react';
import { BarChart } from '@mantine/charts';
import { FinancialCreditReportProps } from './BusinessStability';
import { CateogryList } from './Leverage';
import { getRiskCategoryColor } from 'service/riskCategoryColor';

const LiquidityMeasures: FC<FinancialCreditReportProps> = ({
  financialCreditReportData,
  liquidityMeasures,
}) => {
  const [categoryList, setCatgoryList] = useState<CateogryList>();

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const chartDataArray = financialCreditReportData.reverse().map((item) => ({
      year: item['reportYear'],
      'Current Liabilities': item['totalCurrentLiabilities'],
      'Current Assets': item['totalCurrentAssets'],
    }));

    setChartData(chartDataArray);

    if (liquidityMeasures && liquidityMeasures?.length > 0) {
      setCatgoryList({
        name: 'Current Ratio (Average)',
        riskCategory: liquidityMeasures[0].category,
        description: liquidityMeasures[0].description,
        value: liquidityMeasures[0].currentRatio,
        color: getRiskCategoryColor(liquidityMeasures[0].category),
      });
    }
  }, [financialCreditReportData, liquidityMeasures]);

  const listCurrentRatioDetail = () => {
    return financialCreditReportData.reverse().map((item) => (
      <Stack gap={15} key={item.id}>
        <Text fw={700}>Current Ratio:</Text>
        <Text fw={1000} size="24px" c="rgba(113,113,112,1)">
          {item['currentRatio']}
        </Text>
        <Text fw={700}>Total Current Assets:</Text>
        <Text fw={1000} size="24px" c="rgba(255,196,163,1)">
          <NumberFormatter
            prefix="$"
            value={item['totalCurrentAssets']}
            thousandSeparator
          />
        </Text>
        <Text fw={700}>Total Current Liabilities:</Text>
        <Text fw={1000} size="24px" c="rgba(255,154,162,1)">
          <NumberFormatter
            prefix="$"
            value={item['totalCurrentLiabilities']}
            thousandSeparator
          />
        </Text>
        <Text fw={700} c="rgba(161,160,171,1)">
          Year {item['reportYear']}
        </Text>
      </Stack>
    ));
  };

  return (
    <div>
      <Flex gap="md">
        <Paper shadow="sm" p="lg" radius="md" className="h-fit">
          <Text fw={700} size="xs" mb={12}>
            Liquidity
          </Text>

          <Flex>
            <ActionIcon variant="light" aria-label="Settings" mr={10}>
              <IconChartHistogram
                style={{ width: '70%', height: '70%' }}
                stroke={1.5}
              />
            </ActionIcon>

            <Stack>
              <Flex gap={10}>
                <Text size="xs" lineClamp={2}>
                  Current Ratio (Average)
                </Text>

                <Text fw={700} size="xs">
                  {categoryList?.value}
                </Text>
              </Flex>

              <Flex gap="md">
                <div
                  className={`${categoryList?.color} rounded-lg min-w-[10px] h-[10px] mt-1`}
                ></div>
                <div>
                  <Text size="xs" fw={700} className="capitalize">
                    {categoryList?.riskCategory.toLowerCase()} Risk
                  </Text>
                  <Text size="xs" c="rgba(161,161,170,1)">
                    {categoryList?.description}
                  </Text>
                </div>
              </Flex>
            </Stack>
          </Flex>
        </Paper>

        <Paper shadow="sm" p="lg" radius="md" className="flex-1">
          <Text fw={700} size="xs">
            Current Assets vs Current Liabilities
          </Text>
          <Stack>
            <BarChart
              h={300}
              data={chartData}
              dataKey="year"
              withLegend
              yAxisLabel="Amount ($K)"
              series={[
                { name: 'Current Assets', color: '#4169e1' },
                { name: 'Current Liabilities', color: '#fa8072' },
              ]}
            />

            <Divider my="md" />

            <Flex gap={20} justify={'space-between'}>
              {listCurrentRatioDetail()}
            </Flex>
          </Stack>
        </Paper>
      </Flex>
    </div>
  );
};

export default LiquidityMeasures;
