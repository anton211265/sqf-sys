import {
  Accordion,
  ActionIcon,
  Divider,
  Flex,
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

export interface CateogryList {
  name: string;
  riskCategory: string;
  description: string;
  value: string;
  color: string;
}

const Leverage: FC<FinancialCreditReportProps> = ({
  financialCreditReportData,
  leverage,
}) => {
  const [categoryList, setCatgoryList] = useState<CateogryList[]>([
    {
      name: 'Debt/Equity Ratio (Average)',
      riskCategory: '',
      description: '',
      value: '',
      color: '',
    },
    {
      name: 'Debt/EBITDA Ratio (Average)',
      riskCategory: '',
      description: '',
      value: '',
      color: '',
    },
    {
      name: 'Debt/Capital Ratio (Average)',
      riskCategory: '',
      description: '',
      value: '',
      color: '',
    },
    {
      name: 'RCF/Net Debt Ratio (Average)',
      riskCategory: '',
      description: '',
      value: '',
      color: '',
    },
  ]);
  const [debtEquityChartData, setDebtEquityChartData] = useState<any[]>([]);
  const [debtEBITDAChartData, setDebtEBITDAChartData] = useState<any[]>([]);
  const [debtCapitalChartData, setDebtCapitalChartData] = useState<any[]>([]);
  const [rcfChartData, setRcfChartData] = useState<any[]>([]);
  const [accordionValue, setAccordionValue] = useState<string | null>('item-1');

  useEffect(() => {
    const debtEquityChartDataArray = financialCreditReportData
      .reverse()
      .map((item) => ({
        year: item['reportYear'],
        'Total Debt': item['totalDebt'],
        'Total Equity': item['totalEquity'],
      }));

    const debtEBITDAChartDataArray = financialCreditReportData
      .reverse()
      .map((item) => ({
        year: item['reportYear'],
        'Total Debt': item['totalDebt'],
        EBITDA: item['ebitda'],
      }));

    const debtCapitalChartDataArray = financialCreditReportData
      .reverse()
      .map((item) => ({
        year: item['reportYear'],
        debt: item['totalDebt'],
        capital: item['totalCapital'],
      }));

    const rcfChartDataArray = financialCreditReportData
      .reverse()
      .map((item) => ({
        year: item['reportYear'],
        RCF: item['retainedCashFlow'],
        'Net Debt': item['netDebt'],
      }));

    setDebtEquityChartData(debtEquityChartDataArray);
    setDebtEBITDAChartData(debtEBITDAChartDataArray);
    setDebtCapitalChartData(debtCapitalChartDataArray);
    setRcfChartData(rcfChartDataArray);

    if (leverage && leverage?.length > 0) {
      setCatgoryList((prev) =>
        prev.map((item, index) => {
          const leverageItem = leverage[index];
          const value = Object.values(leverageItem)[0] as string; // e.g., "0.42"
          const category = leverageItem.category;
          const description = leverageItem.description;

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
  }, [financialCreditReportData, leverage]);

  const listDebtEquityDetail = () => {
    return financialCreditReportData.reverse().map((item) => (
      <Stack gap={15} key={item.id}>
        <Text fw={700}>Debt/Equity Ratio:</Text>
        <Text fw={1000} size="24px" c="rgba(113,113,112,1)">
          {item['debtToEquity']}
        </Text>
        <Text fw={700}>Total Debt:</Text>
        <Text fw={1000} size="24px" c="rgba(255,196,163,1)">
          <NumberFormatter
            prefix="$"
            value={item['totalDebt']}
            thousandSeparator
          />
        </Text>
        <Text fw={700}>Total Equity:</Text>
        <Text fw={1000} size="24px" c="rgba(255,154,162,1)">
          <NumberFormatter
            prefix="$"
            value={item['totalEquity']}
            thousandSeparator
          />
        </Text>
        <Text fw={700} c="rgba(161,160,171,1)">
          Year {item['reportYear']}
        </Text>
      </Stack>
    ));
  };

  const listDebtEbitdaDetail = () => {
    return financialCreditReportData.reverse().map((item) => (
      <Stack gap={15} key={item.id}>
        <Text fw={700}>Debt/EBITDA Ratio:</Text>
        <Text fw={1000} size="24px" c="rgba(113,113,112,1)">
          {item['debtToEbitda']}
        </Text>
        <Text fw={700}>Total Debt:</Text>
        <Text fw={1000} size="24px" c="rgba(255,196,163,1)">
          <NumberFormatter
            prefix="$"
            value={item['totalDebt']}
            thousandSeparator
          />
        </Text>
        <Text fw={700}>Total EBITDA:</Text>
        <Text fw={1000} size="24px" c="rgba(255,154,162,1)">
          <NumberFormatter
            prefix="$"
            value={item['ebitda']}
            thousandSeparator
          />
        </Text>
        <Text fw={700} c="rgba(161,160,171,1)">
          Year {item['reportYear']}
        </Text>
      </Stack>
    ));
  };

  const listDebtCapitalDetail = () => {
    return financialCreditReportData.reverse().map((item) => (
      <Stack gap={15} key={item.id}>
        <Text fw={700}>Debt/Capital Ratio:</Text>
        <Text fw={1000} size="24px" c="rgba(113,113,112,1)">
          {item['debtToCapital']}
        </Text>
        <Text fw={700}>Total Debt:</Text>
        <Text fw={1000} size="24px" c="rgba(255,196,163,1)">
          <NumberFormatter
            prefix="$"
            value={item['totalDebt']}
            thousandSeparator
          />
        </Text>
        <Text fw={700}>Total Capital:</Text>
        <Text fw={1000} size="24px" c="rgba(255,154,162,1)">
          <NumberFormatter
            prefix="$"
            value={item['totalCapital']}
            thousandSeparator
          />
        </Text>
        <Text fw={700} c="rgba(161,160,171,1)">
          Year {item['reportYear']}
        </Text>
      </Stack>
    ));
  };

  const listRcfNetDebtDetail = () => {
    return financialCreditReportData.reverse().map((item) => (
      <Stack gap={15} key={item.id}>
        <Text fw={700}>RCF/Net Debt Ratio:</Text>
        <Text fw={1000} size="24px" c="rgba(113,113,112,1)">
          {item['rcfToNetDebt']}
        </Text>
        <Text fw={700}>Total RCF:</Text>
        <Text fw={1000} size="24px" c="rgba(255,196,163,1)">
          <NumberFormatter
            prefix="$"
            value={item['retainedCashFlow']}
            thousandSeparator
          />
        </Text>
        <Text fw={700}>Net Debt:</Text>
        <Text fw={1000} size="24px" c="rgba(255,154,162,1)">
          <NumberFormatter
            prefix="$"
            value={item['netDebt']}
            thousandSeparator
          />
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
            Leverage
          </Text>
          <Stack gap={10}>{displayCategoryList()}</Stack>
        </Paper>

        <Accordion
          value={accordionValue}
          onChange={setAccordionValue}
          variant="contained"
          className="flex flex-1 flex-col gap-[20px] "
        >
          <Accordion.Item value="item-1" className="bg-white">
            <Accordion.Control>
              <Text fw={700}>Total Debt vs. Total Equity</Text>
            </Accordion.Control>
            <Accordion.Panel className="bg-white">
              {accordionValue == 'item-1' && (
                <Stack>
                  <BarChart
                    h={300}
                    data={debtEquityChartData}
                    dataKey="year"
                    withLegend
                    yAxisLabel="Amount ($K)"
                    series={[
                      { name: 'Total Debt', color: '#ff0100' },
                      { name: 'Total Equity', color: '#0600ff' },
                    ]}
                  />

                  <Divider my="md" />

                  <Flex className="justify-around">
                    {listDebtEquityDetail()}
                  </Flex>
                </Stack>
              )}
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="item-2" className="bg-white">
            <Accordion.Control>
              <Text fw={700}>Debt vs. EBITDA Over Time</Text>
            </Accordion.Control>
            <Accordion.Panel className="bg-white">
              {accordionValue == 'item-2' && (
                <Stack>
                  <BarChart
                    h={300}
                    data={debtEBITDAChartData}
                    dataKey="year"
                    withLegend
                    yAxisLabel="Amount ($K)"
                    series={[
                      { name: 'Total Debt', color: '#ff0100' },
                      { name: 'EBITDA', color: '#0600ff' },
                    ]}
                  />

                  <Divider my="md" />

                  <Flex className="justify-around">
                    {listDebtEbitdaDetail()}
                  </Flex>
                </Stack>
              )}
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="item-3" className="bg-white">
            <Accordion.Control>
              <Text fw={700}>Debt vs. Equity in Capital Structure</Text>
            </Accordion.Control>
            <Accordion.Panel className="bg-white">
              {accordionValue == 'item-3' && (
                <Stack>
                  <BarChart
                    h={300}
                    data={debtCapitalChartData}
                    dataKey="year"
                    withLegend
                    yAxisLabel="Amount ($K)"
                    series={[
                      { name: 'debt', color: '#ff6b6b' },
                      { name: 'capital', color: '#4d96ff' },
                    ]}
                  />

                  <Divider my="md" />

                  <Flex className="justify-around">
                    {listDebtCapitalDetail()}
                  </Flex>
                </Stack>
              )}
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="item-4" className="bg-white">
            <Accordion.Control>
              <Text fw={700}>RCF vs. Net Debt</Text>
            </Accordion.Control>
            <Accordion.Panel className="bg-white">
              {accordionValue == 'item-4' && (
                <Stack>
                  <BarChart
                    h={300}
                    data={rcfChartData}
                    dataKey="year"
                    withLegend
                    yAxisLabel="Amount ($K)"
                    series={[
                      { name: 'RCF', color: '#3cb371' },
                      { name: 'Net Debt', color: '#ff6347' },
                    ]}
                  />

                  <Divider my="md" />

                  <Flex className="justify-around">
                    {listRcfNetDebtDetail()}
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

export default Leverage;
