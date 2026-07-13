import {
  ActionIcon,
  Divider,
  Flex,
  NumberFormatter,
  Paper,
  Stack,
  Text,
} from '@mantine/core';
import React, { FC, useEffect, useState } from 'react';
import { IconReceiptDollar } from '@tabler/icons-react';
import { BarChart } from '@mantine/charts';
import { FinancialCreditReportProps } from './BusinessStability';
import { CateogryList } from './Leverage';
import { getRiskCategoryColor } from 'service/riskCategoryColor';

const AssetManagement: FC<FinancialCreditReportProps> = ({
  financialCreditReportData,
  assetManagement,
}) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [categoryList, setCatgoryList] = useState<CateogryList>();

  useEffect(() => {
    const chartDataArray = financialCreditReportData.reverse().map((item) => ({
      year: item['reportYear'],
      Loans: item['totalLoan'],
      'Account Receivables': item['accountReceivables'],
    }));

    setChartData(chartDataArray);
    if (assetManagement && assetManagement?.length > 0) {
      setCatgoryList({
        name: 'Loans/Receivables Ratio (Average)',
        riskCategory: assetManagement[0].category,
        description: assetManagement[0].description,
        value: assetManagement[0].loanReceivableRatio,
        color: getRiskCategoryColor(assetManagement[0].category),
      });
    }
  }, [financialCreditReportData, assetManagement]);

  const listLoanReceivableDetail = () => {
    return financialCreditReportData.reverse().map((item) => (
      <Stack gap={15} key={item.id}>
        <Text fw={700}>Loans/Receivables Ratio:</Text>
        <Text fw={1000} size="24px" c="rgba(113,113,112,1)">
          {item['loanToReceivable']}
        </Text>
        <Text fw={700}>Total Loans:</Text>
        <Text fw={1000} size="24px" c="rgba(238,190,250,1)">
          <NumberFormatter
            prefix="$"
            value={item['totalLoan']}
            thousandSeparator
          />
        </Text>
        <Text fw={700}>Total Accounts Receivables:</Text>
        <Text fw={1000} size="24px" c="rgba(160,231,229,1)">
          <NumberFormatter
            prefix="$"
            value={item['accountReceivables']}
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
            Asset Management
          </Text>

          <Flex>
            <ActionIcon variant="light" aria-label="Settings" mr={10}>
              <IconReceiptDollar
                style={{ width: '70%', height: '70%' }}
                stroke={1.5}
              />
            </ActionIcon>

            <Stack>
              <Flex gap={10}>
                <Text size="xs" lineClamp={2}>
                  Loans/Receivables Ratio (Average)
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

        <Paper shadow="sm" p="lg" radius="md" className="flex-1 min-w-[300px]">
          <Text fw={700} size="xs">
            Loans/Account Receivables Over Time
          </Text>
          <Stack>
            <BarChart
              h={300}
              data={chartData}
              dataKey="year"
              withLegend
              yAxisLabel="Amount ($K)"
              series={[
                { name: 'Loans', color: '#ffaf02' },
                { name: 'Account Receivables', color: '#f4691f' },
              ]}
            />

            <Divider my="md" />

            <Flex gap={30} justify={'space-between'}>
              {listLoanReceivableDetail()}
            </Flex>
          </Stack>
        </Paper>
      </Flex>
    </div>
  );
};

export default AssetManagement;
