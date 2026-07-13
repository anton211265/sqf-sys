import {
  Accordion,
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
import { getRiskCategoryColor } from 'service/riskCategoryColor';

interface CateogryList {
  name: string;
  riskCategory: string;
  description: string;
  value: string;
  color: string;
}

const Coverage: FC<FinancialCreditReportProps> = ({
  financialCreditReportData,
  coverage,
}) => {
  const [categoryList, setCatgoryList] = useState<CateogryList[]>([
    {
      name: 'EBITDA/Interest Expense Ratio (Average)',
      riskCategory: '',
      description: '',
      value: '',
      color: '',
    },
    {
      name: 'Debt Service Coverage Ratio (DSCR) (Average)',
      riskCategory: '',
      description: '',
      value: '',
      color: '',
    },
  ]);

  const [ebitdaInterestExpenseChartData, setEbitdaInterestExpenseChartData] =
    useState<any[]>([]);
  const [debtSerivceCoverageChartData, setDebtSerivceCoveragChartData] =
    useState<any[]>([]);

  const [accordionValue, setAccordionValue] = useState<string | null>('item-1');

  useEffect(() => {
    const ebitdaInterestExpenseChartDataArray = financialCreditReportData
      .reverse()
      .map((item) => ({
        year: item['reportYear'],
        EBITDA: item['ebitda'],
        'Interest Expense': item['interestExpense'],
      }));

    const debtSerivceCoverageChartDataArray = financialCreditReportData
      .reverse()
      .map((item) => ({
        year: item['reportYear'],
        DSCR: item['debtServiceCoverageRatio'],
      }));

    setEbitdaInterestExpenseChartData(ebitdaInterestExpenseChartDataArray);
    setDebtSerivceCoveragChartData(debtSerivceCoverageChartDataArray);

    if (coverage && coverage?.length > 0) {
      setCatgoryList((prev) =>
        prev.map((item, index) => {
          const coverageItem = coverage[index];
          const value = Object.values(coverageItem)[0] as string; // e.g., "0.42"
          const category = coverageItem.category;
          const description = coverageItem.description;

          return {
            ...item,
            riskCategory: category,
            description,
            value,
            color: getRiskCategoryColor(category),
          };
        })
      );
    }
  }, [financialCreditReportData]);

  const listEbitdaInterestExpenseDetail = () => {
    return financialCreditReportData.reverse().map((item) => (
      <Stack gap={15} key={item.id}>
        <Text fw={700}>EBITDA/Interest Expense:</Text>
        <Text fw={1000} size="24px" c="rgba(113,113,112,1)">
          {item['ebitdaToInterestExpense']}
        </Text>
        <Text fw={700}>EBITDA:</Text>
        <Text fw={1000} size="24px" c="rgba(255,196,163,1)">
          <NumberFormatter
            prefix="$"
            value={item['ebitda']}
            thousandSeparator
          />
        </Text>
        <Text fw={700}>Total Interest Expense:</Text>
        <Text fw={1000} size="24px" c="rgba(255,154,162,1)">
          <NumberFormatter
            prefix="$"
            value={item['interestExpense']}
            thousandSeparator
          />
        </Text>
        <Text fw={700} c="rgba(161,160,171,1)">
          Year {item['reportYear']}
        </Text>
      </Stack>
    ));
  };

  const listDebtServiceCoverageDetail = () => {
    return financialCreditReportData.reverse().map((item) => (
      <Stack gap={15} key={item.id}>
        <Text fw={700}>Debt Service Coverage Ratio:</Text>
        <Text fw={1000} size="24px" c="rgba(113,113,112,1)">
          {item['debtServiceCoverageRatio']}
        </Text>

        <Text fw={700} c="rgba(161,160,171,1)">
          Year {item['reportYear']}
        </Text>
      </Stack>
    ));
  };

  const displayCategoryList = () => {
    return categoryList.map((item, index) => (
      <Flex key={index}>
        <ActionIcon variant="light" aria-label="Settings" mr={10}>
          <IconChartHistogram
            style={{ width: '70%', height: '70%' }}
            stroke={1.5}
          />
        </ActionIcon>

        <Stack>
          <Flex gap={10}>
            <Text size="xs" lineClamp={2}>
              {item.name}
            </Text>

            <Text fw={700} size="xs">
              {item.value}
            </Text>
          </Flex>

          <Flex gap="md">
            <div
              className={`${item.color} rounded-lg min-w-[10px] h-[10px] mt-1`}
            ></div>
            <div>
              <Text size="xs" fw={700} className="capitalize">
                {item.riskCategory.toLowerCase()} Risk
              </Text>
              <Text size="xs" c="rgba(161,161,170,1)">
                {item.description}
              </Text>
            </div>
          </Flex>
        </Stack>
      </Flex>
    ));
  };

  return (
    <div>
      <Flex gap="md">
        <Paper shadow="sm" p="lg" radius="md" className="h-fit">
          <Text fw={700} size="xs" mb={12}>
            Coverage
          </Text>
          <Stack gap={10}>{displayCategoryList()}</Stack>
        </Paper>

        <Accordion
          value={accordionValue}
          onChange={setAccordionValue}
          variant="contained"
          className="flex flex-1 flex-col gap-[20px] "
        >
          <Accordion.Item value="item-1" className="bg-white  min-w-[350px]">
            <Accordion.Control>
              <Text fw={700}>EBITDA/Interest Expense Ratio</Text>
            </Accordion.Control>
            <Accordion.Panel className="bg-white">
              {accordionValue == 'item-1' && (
                <Stack>
                  <BarChart
                    h={300}
                    data={ebitdaInterestExpenseChartData}
                    dataKey="year"
                    withLegend
                    yAxisLabel="Amount ($K)"
                    series={[
                      { name: 'EBITDA', color: '#0600ff' },
                      { name: 'Interest Expense', color: '#ffa500' },
                    ]}
                  />

                  <Divider my="md" />

                  <Flex className="justify-around">
                    {listEbitdaInterestExpenseDetail()}
                  </Flex>
                </Stack>
              )}
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="item-2" className="bg-white  min-w-[350px]">
            <Accordion.Control>
              <Text fw={700}>Debt Service Coverage Ratio (DSCR)</Text>
            </Accordion.Control>
            <Accordion.Panel className="bg-white ">
              {accordionValue == 'item-2' && (
                <Stack gap={'md'}>
                  <BarChart
                    h={300}
                    data={debtSerivceCoverageChartData}
                    dataKey="year"
                    withLegend
                    yAxisLabel="Amount ($K)"
                    series={[{ name: 'DSCR', color: 'indigo.9' }]}
                  />

                  <Flex className="justify-around">
                    {listDebtServiceCoverageDetail()}
                  </Flex>
                </Stack>
              )}
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Flex>
    </div>
  );
};

export default Coverage;
