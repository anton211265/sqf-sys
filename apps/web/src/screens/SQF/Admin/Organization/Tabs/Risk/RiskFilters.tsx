import { PieChart } from '@mantine/charts';
import {
  Divider,
  Flex,
  Text,
  Button,
  Group,
  Paper,
  ActionIcon,
  Stack,
  Progress,
  Center,
  RingProgress,
  Grid,
  useMantineTheme,
  Select,
  Table,
  Alert,
  Modal,
  Switch,
  Tabs,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconActivity,
  IconAlertTriangle,
  IconChartPie,
  IconCheck,
} from '@tabler/icons-react';
import axios from 'axios';
import { BASE_URL } from 'constants/constant';
import { RiskLevelColorEnum } from 'constants/enum';
import { ADMIN } from 'constants/routes';
import React, { FC, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDateDDMMYYYY } from 'service/formatDate';
import classes from './RiskFilters.module.css';
import RiskFilter1 from './RiskFilter1';

interface RiskFiltersProps {
  applicationArray: any[];
}

export interface RiskFilter1ScoreProps {
  riskFilter1Category: string | null;
  riskFilter1LastUpdatedAt: string | null;
  riskFilter1Status: string | null;
  riskProfileCode: string | null;
  riskProfileId: number | null;
  totalScoreRiskFilter1: string | null;
}

const RiskFilters: FC<RiskFiltersProps> = ({ applicationArray }) => {
  const [activeTab, setActiveTab] = useState<string | null>('riskFilter1');

  const { organizationId } = useParams(); // Extract the ID from the URL

  const [pieChartdata, setPieChartdata] = useState<any[]>([
    { name: '', value: 100, color: 'gray.3' },
  ]);
  const theme = useMantineTheme();
  const [tabDropdown, setTabDropdown] = useState<string[]>([]);

  const [grading, setGrading] = useState<any[]>([]);
  const [totalWeightage, setTotalWeightage] = useState<number>(0);
  const [totalScore, setTotalScore] = useState<number>(0);
  const navigate = useNavigate();
  const [riskModelSelectMode, setRiskModelSelectMode] = useState<boolean>(true);
  const [riskModelData, setRiskModelData] = useState<any[]>([]);
  const [selectedRiskModel, setSelectedRiskModel] = useState<string | null>('');
  const [selectedApplicationNumber, setSelectedApplicationNumber] = useState<
    string | null
  >('');
  const [applicationNumberSelectMode, setApplicationNumberSelectMode] =
    useState<boolean>(true);
  const [opened, { open, close }] = useDisclosure(false); // new risk model modal
  const [isAuthorizationRequired, setIsAuthorizationRequired] =
    useState<boolean>(false);

  const [completedFactors, setCompletedFactors] = useState<number>(0);
  const [totalFactors, setTotalFactors] = useState<number>(0);
  const [progressCompletionPercentage, setProgressCompletionPercentage] =
    useState<number>(0);
  const [isRiskSurveyCompleted, setIsRiskSurveyCompleted] =
    useState<boolean>(false);
  const [selectedRiskParam, setSelectedRiskParam] = useState<string | null>('');
  const [groupedChartData, setGroupedChartData] = useState<any>({});
  const [riskPortfolioScore, setRiskPortfolioScore] = useState<string>('0');
  const [riskPortfolioColor, setRiskPortfolioColor] = useState<string>(
    'rgba(24, 161, 83, 1)'
  );
  const [riskCategory, setRiskCategory] = useState<string | null>('');
  const [updatedAt, setUpdatedAt] = useState<string | null>('');
  const [confirmApplicationNum, setConfirmApplicationNum] =
    useState<boolean>(false);
  const [riskFilter1, setRiskFilter1] = useState<RiskFilter1ScoreProps | null>(
    null
  );

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const applicationParam = urlParams.get('application');
    if (applicationParam) {
      setConfirmApplicationNum(true);
      setSelectedApplicationNumber(applicationParam);
    }

    fetchRiskModelData();
  }, []);

  useEffect(() => {
    if (selectedApplicationNumber && confirmApplicationNum) {
      fetchApplicationNumberScoring();
    }
  }, [selectedApplicationNumber, confirmApplicationNum]);

  const fetchRiskModelData = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/risk-operation/api/risk-model`,
        {
          params: {
            riskModelStatus: 'PUBLISHED',
          },
        }
      );

      const fetchedRiskModelsData = response.data.data;

      setRiskModelData(fetchedRiskModelsData); // Update state with fetched org data
    } catch (error) {
      console.error('Error fetching risk model:', error);
      // Show error notification (with "once" to prevent duplication)
      notifications.show({
        id: 'fetch-error', // Unique ID to ensure it displays only once
        title: 'Error',
        message: 'Failed to fetched risk model',
        color: 'red',
        autoClose: 2000,
      });
    }
  };

  const getRandomColor = () => {
    const colors = Object.keys(theme.colors); // Get all Mantine colors
    const randomColor = colors[Math.floor(Math.random() * colors.length)]; // Pick a random color
    const randomShade = Math.floor(Math.random() * 10); // Pick a random shade from 0-9
    return theme.colors[randomColor][randomShade]; // Return the color with the random shade
  };

  const updateScoreWeight = (data: any) => {
    let remaining = 100;

    const scoreData = data.map((item: any) => {
      remaining = remaining - item.weight;
      return {
        name: item.riskFactorName,
        value: Number(item.weight),
        color: getRandomColor(),
      };
    });

    if (remaining !== 0) {
      scoreData.push({ name: 'Unassign', value: remaining, color: 'gray.3' });
    }

    setPieChartdata(scoreData);
  };

  const riskSurveyClick = () => {
    navigate(
      ADMIN.ORGANIZATIONRISKSURVEYVIEW.replace(
        ':organizationId',
        organizationId as string
      ).replace(':applicationNo', selectedApplicationNumber as string)
    );
  };

  const assignRiskModel = async () => {
    const payload = {
      riskModelNumber: selectedRiskModel,
    };
    axios
      .post(
        `${BASE_URL}/risk-operation/api/risk-application-scoring/${selectedApplicationNumber}/assign-risk-model`,
        payload
      )
      .then((resp) => {
        setRiskModelSelectMode(false);
        fetchRiskFactorScores();
        fetchRiskFactorSurveyProgress();
      });
  };

  const onConfirmRiskModel = () => {
    assignRiskModel();
    setRiskModelSelectMode(false);
  };

  const fetchRiskFactorScores = async () => {
    axios
      .get(
        `${BASE_URL}/risk-operation/api/risk-factor-scoring/${selectedApplicationNumber}/risk-factor-scores`,
        {
          params: {
            includeRiskParameterGrading: true,
          },
        }
      )
      .then((resp) => {
        const chartData = resp.data.data;

        const riskFactorNames = chartData.map(
          (item: any) => item.riskFactorName
        );
        setSelectedRiskParam(riskFactorNames[0]);

        const groupedChartDataTemp = chartData.reduce((acc: any, item: any) => {
          if (!acc[item.riskFactorName]) {
            acc[item.riskFactorName] = [];
          }
          acc[item.riskFactorName].push(item);
          return acc;
        }, {});

        setGroupedChartData(groupedChartDataTemp);

        setGrading(groupedChartDataTemp[riskFactorNames[0]][0].subFactors);

        setTabDropdown(riskFactorNames);

        const totalWeightageCal = groupedChartDataTemp[
          riskFactorNames[0]
        ][0].subFactors.reduce(
          (sum: number, item: any) => sum + Number(item.weight),
          0
        );
        setTotalWeightage(totalWeightageCal);

        const totalScoreCal = groupedChartDataTemp[
          riskFactorNames[0]
        ][0].subFactors.reduce((sum: number, item: any) => sum + item.score, 0);

        setTotalScore(totalScoreCal);

        updateScoreWeight(chartData);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const fetchRiskFactorSurveyProgress = async () => {
    axios
      .get(
        `${BASE_URL}/risk-operation/api/risk-factor-scoring/${selectedApplicationNumber}/risk-factor-survey-progress`
      )
      .then((resp) => {
        setCompletedFactors(resp.data.data.completedFactors);
        setTotalFactors(resp.data.data.totalFactors);

        setProgressCompletionPercentage(
          resp.data.data.progressCompletionPercentage
        );
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const fetchApplicationNumberScoring = async () => {
    axios
      .get(
        `${BASE_URL}/risk-operation/api/risk-application-scoring/${selectedApplicationNumber}`
      )
      .then((resp) => {
        const responseData = resp.data.data;

        setRiskFilter1(responseData.riskFilter1);

        const url = new URL(window.location.href);
        const applicationParam = url.searchParams.get('application');

        if (!applicationParam) {
          url.searchParams.append(
            'application',
            selectedApplicationNumber as string
          );
          window.history.replaceState(null, '', url.toString());
        } else {
          if (applicationParam !== selectedApplicationNumber) {
            url.searchParams.set(
              'application',
              selectedApplicationNumber as string
            );
            window.history.replaceState(null, '', url.toString());
          }
        }

        //Set data on 'Overall Risk Portfolio Score' card
        setUpdatedAt(formatDateDDMMYYYY(responseData.lastUpdatedAt));
        setRiskCategory(responseData.riskCategory);
        switch (responseData.riskCategory) {
          case 'LOW':
            setRiskPortfolioColor(RiskLevelColorEnum.LOW_RISK);
            break;
          case 'MEDIUM':
            setRiskPortfolioColor(RiskLevelColorEnum.MEDIUM_RISK);
            break;
          case 'HIGH':
            setRiskPortfolioColor(RiskLevelColorEnum.HIGH_RISK);
            break;
        }

        if (responseData.totalScoreRiskFilter2 !== null) {
          setRiskPortfolioScore(responseData.totalScoreRiskFilter2);
        }

        setIsRiskSurveyCompleted(responseData.isRiskSurveyCompleted);
        if (responseData.riskModelNumber) {
          setRiskModelSelectMode(false);
          setSelectedRiskModel(responseData.riskModelNumber);
          fetchRiskFactorScores();
          fetchRiskFactorSurveyProgress();
        } else {
          setRiskModelSelectMode(true);
        }
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        setApplicationNumberSelectMode(false);
        setConfirmApplicationNum(false);
      });
  };

  const onConfirmApplicationNumber = () => {
    setConfirmApplicationNum(true);
  };

  const onSubmitSettlement = () => {
    const payload = {
      isAuthorizationRequired: isAuthorizationRequired,
    };
    axios
      .post(
        `${BASE_URL}/risk-operation/api/risk-application-scoring/${selectedApplicationNumber}/submit-for-settlement`,
        payload
      )
      .then((resp) => {
        notifications.show({
          title: 'Success',
          message: 'Risk assessment submitted for settlement',
          color: 'green',
        });

        setIsRiskSurveyCompleted(resp.data.data.isRiskSurveyCompleted);
        close();
      })
      .catch((error) => {
        console.log(error);
        // Show error notification (with "once" to prevent duplication)
        notifications.show({
          id: 'fetch-error', // Unique ID to ensure it displays only once
          title: 'Error',
          message: error.response.data.message,
          color: 'red',
          autoClose: 2000,
        });
      });
  };

  const updateRiskParamTable = (value: string) => {
    setGrading(groupedChartData[value][0].subFactors);
    setSelectedRiskParam(value);

    const totalWeightageCal = groupedChartData[value][0].subFactors.reduce(
      (sum: number, item: any) => sum + Number(item.weight),
      0
    );
    setTotalWeightage(totalWeightageCal);

    const totalScoreCal = groupedChartData[value][0].subFactors.reduce(
      (sum: number, item: any) => sum + item.score,
      0
    );

    setTotalScore(totalScoreCal);
  };

  return (
    <>
      <Tabs
        variant="unstyled"
        value={activeTab}
        onChange={setActiveTab}
        classNames={classes}
      >
        <Flex justify="space-between" className="mb-5" gap="md">
          <Flex gap={10}>
            <Select
              placeholder="Please choose an application"
              data={applicationArray
                ?.filter((param) => param.applicationNumber != null)
                .map((param) => ({
                  label: param.applicationNumber,
                  value: param.applicationNumber,
                }))}
              value={selectedApplicationNumber}
              onChange={setSelectedApplicationNumber}
            />

            <Group>
              <ActionIcon
                onClick={onConfirmApplicationNumber}
                variant="primary"
              >
                <IconCheck size={16} stroke={1.5} />
              </ActionIcon>
            </Group>
          </Flex>

          <Tabs.List grow>
            <Tabs.Tab value="riskFilter1">Risk Filter #1</Tabs.Tab>
            <Tabs.Tab value="riskFilter2">Risk Filter #2</Tabs.Tab>
          </Tabs.List>
        </Flex>

        {!applicationNumberSelectMode && (
          <>
            <Tabs.Panel value="riskFilter1">
              {activeTab === 'riskFilter1' && (
                <>
                  <RiskFilter1
                    selectedApplicationNumber={
                      selectedApplicationNumber as string
                    }
                    organizationId={organizationId as string}
                    riskFilter1Score={riskFilter1}
                  ></RiskFilter1>
                </>
              )}
            </Tabs.Panel>

            <Tabs.Panel value="riskFilter2">
              {activeTab === 'riskFilter2' && (
                <>
                  <Group justify="space-between" className="mb-5">
                    <div>
                      <Text size="sm" fw={700}>
                        Risk Filter #2 Analysis
                      </Text>

                      <Text c="dimmed" size="xs">
                        Detailed Analysis for Risk Filter #2
                      </Text>
                    </div>

                    {!riskModelSelectMode && (
                      <Group>
                        <Button onClick={riskSurveyClick}>
                          Take Risk Survey
                        </Button>
                        <Button onClick={open}>Submit for Settlement</Button>
                      </Group>
                    )}
                  </Group>

                  {riskModelSelectMode && (
                    <>
                      <Select
                        label="Please choose your risk model"
                        data={riskModelData?.map((param) => ({
                          label: param.riskModelName,
                          value: param.riskModelNumber,
                        }))}
                        value={selectedRiskModel}
                        onChange={setSelectedRiskModel}
                      />

                      <Group mt="sm">
                        <ActionIcon
                          onClick={onConfirmRiskModel}
                          variant="primary"
                        >
                          <IconCheck size={16} stroke={1.5} />
                        </ActionIcon>
                      </Group>
                    </>
                  )}

                  {!riskModelSelectMode && (
                    <>
                      {!isRiskSurveyCompleted && (
                        <Alert
                          variant="light"
                          color="yellow"
                          radius="md"
                          title=""
                          icon={<IconAlertTriangle />}
                          mb="md"
                        >
                          Your risk survey is incomplete. Click{' '}
                          <Text span fw={700}>
                            ‘Risk Survey’
                          </Text>{' '}
                          to finish the process.
                        </Alert>
                      )}

                      <Flex gap="md">
                        <Stack gap="md">
                          {/* Overall Risk Score */}
                          <Paper p="lg" radius="lg">
                            <Group justify="space-between">
                              <div>
                                <Text
                                  fw={700}
                                  size="sm"
                                  c="rgba(146,145,165,1)"
                                >
                                  Statistics
                                </Text>

                                <Text fw={700} size="xs">
                                  Overall Risk Portfolio Score
                                </Text>
                              </div>

                              <div>
                                <ActionIcon
                                  variant="outline"
                                  radius="lg"
                                  aria-label="Activity"
                                >
                                  <IconActivity size={16} stroke={1.5} />
                                </ActionIcon>
                              </div>
                            </Group>

                            <Flex>
                              <div className="content-end">
                                <Text size="xl" fw={700} className="capitalize">
                                  {riskCategory?.toLowerCase()} Risk
                                </Text>
                                <Text size="xs">Updated on {updatedAt}</Text>
                              </div>

                              <RingProgress
                                size={180}
                                thickness={20}
                                sections={[
                                  {
                                    value: +riskPortfolioScore,
                                    color: riskPortfolioColor,
                                  },
                                ]}
                                label={
                                  <Text
                                    c={riskPortfolioColor}
                                    fw={700}
                                    ta="center"
                                    size="xl"
                                  >
                                    {riskPortfolioScore}%
                                  </Text>
                                }
                              />
                            </Flex>
                          </Paper>

                          {/* Risk Scorin Survey */}

                          <Paper p="lg" radius="lg">
                            <Group justify="space-between">
                              <div>
                                <Text
                                  fw={700}
                                  size="sm"
                                  c="rgba(146,145,165,1)"
                                >
                                  Progress
                                </Text>

                                <Text fw={700} size="xs">
                                  Risk Scoring Survey{' '}
                                </Text>
                              </div>

                              <div>
                                <ActionIcon
                                  variant="outline"
                                  radius="lg"
                                  aria-label="Activity"
                                >
                                  <IconActivity size={16} stroke={1.5} />
                                </ActionIcon>
                              </div>
                            </Group>
                            <Center my="md">
                              <div>
                                <Text size="xl" ta="center" fw={700}>
                                  {completedFactors}/{totalFactors}
                                </Text>
                                <Text>Factors Completed</Text>
                              </div>
                            </Center>

                            <Group justify="space-between">
                              <Text>Progress</Text>
                              <Text fw={700}>
                                {progressCompletionPercentage}%
                              </Text>
                            </Group>
                            <Progress
                              size={40}
                              value={progressCompletionPercentage}
                            />
                          </Paper>
                        </Stack>

                        {/* Risk Factor Score */}
                        <Paper p="lg" radius="lg">
                          <Group justify="space-between">
                            <div>
                              <Text fw={700} size="sm" c="rgba(146,145,165,1)">
                                Statistics
                              </Text>

                              <Text fw={700} size="xs">
                                Risk Factor Score
                              </Text>
                            </div>

                            <div>
                              <ActionIcon
                                variant="outline"
                                radius="lg"
                                aria-label="Activity"
                              >
                                <IconActivity size={16} stroke={1.5} />
                              </ActionIcon>
                            </div>
                          </Group>

                          {/* <Center style={{ width: '100%', height: '380px' }}> */}
                          <PieChart
                            //   className={classes.chartOutline}
                            data={pieChartdata}
                            strokeWidth={0}
                            size={200}
                            withLabelsLine
                            labelsPosition="outside"
                            labelsType="percent"
                            withLabels
                            withTooltip
                            tooltipDataSource="segment"
                          />
                          {/* </Center> */}

                          <Grid>
                            {pieChartdata.map((data, index) => (
                              <Grid.Col span={{ base: 12, md: 6 }} key={index}>
                                <Flex align="center" gap={10}>
                                  <div
                                    style={{
                                      backgroundColor: data.color,
                                      minWidth: 10,
                                      height: 10,
                                    }}
                                  ></div>
                                  <Text size="sm">{data.name}</Text>
                                </Flex>
                              </Grid.Col>
                            ))}
                          </Grid>
                        </Paper>

                        {/* Risk Model Weightage */}
                        <Paper p="lg" radius="lg">
                          <Group justify="space-between">
                            <div>
                              <Text fw={700} size="sm" c="rgba(146,145,165,1)">
                                Statistics
                              </Text>

                              <Text fw={700} size="xs">
                                Risk Model Weightage
                              </Text>
                            </div>

                            <div>
                              <ActionIcon
                                variant="outline"
                                radius="lg"
                                aria-label="Activity"
                              >
                                <IconActivity size={16} stroke={1.5} />
                              </ActionIcon>
                            </div>
                          </Group>

                          <RingProgress
                            size={280}
                            thickness={30}
                            sections={pieChartdata}
                          />
                          <Grid>
                            {pieChartdata.map((data, index) => (
                              <Grid.Col span={{ base: 12, md: 6 }} key={index}>
                                <Flex align="center" gap={5}>
                                  <div
                                    style={{
                                      backgroundColor: data.color,
                                      minWidth: 10,
                                      height: 10,
                                    }}
                                  ></div>
                                  <Text size="sm">{data.name}</Text> -
                                  <Text size="sm" fw={700}>
                                    {data.value}%
                                  </Text>
                                </Flex>
                              </Grid.Col>
                            ))}
                          </Grid>
                        </Paper>
                      </Flex>

                      {/* Risk Parameters Grading */}
                      <Paper p="lg" radius="lg" mt="md">
                        <Group justify="space-between">
                          <div>
                            <Text fw={700} size="sm" c="rgba(146,145,165,1)">
                              Statistics
                            </Text>

                            <Text fw={700} size="xs">
                              Risk Parameters Grading
                            </Text>
                          </div>

                          <div>
                            <Select
                              data={tabDropdown}
                              value={selectedRiskParam}
                              onChange={(value) =>
                                updateRiskParamTable(value as string)
                              }
                            />
                          </div>
                        </Group>

                        <Table my="md">
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>Sub-factor</Table.Th>
                              <Table.Th>Weightage</Table.Th>
                              <Table.Th>Score</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {grading &&
                              grading.length > 0 &&
                              grading.map((element) => (
                                <Table.Tr key={element.riskFactorName}>
                                  <Table.Td>{element.riskFactorName}</Table.Td>
                                  <Table.Td>{element.weight}%</Table.Td>
                                  <Table.Td>{element.score}</Table.Td>
                                </Table.Tr>
                              ))}

                            <Table.Tr>
                              <Table.Td>
                                <Text fw={700}>Total</Text>
                              </Table.Td>
                              <Table.Td>{totalWeightage}%</Table.Td>
                              <Table.Td>{totalScore}</Table.Td>
                            </Table.Tr>
                          </Table.Tbody>
                        </Table>
                      </Paper>

                      <Modal
                        opened={opened}
                        onClose={close}
                        centered
                        size="lg"
                        styles={{
                          content: {
                            padding: '15px',
                          },
                        }}
                        title="Are you sure you want to proceed?"
                      >
                        <Text my="md">
                          Please confirm if authorization is required to
                          complete the risk assessment.
                        </Text>

                        <Switch
                          labelPosition="left"
                          label="Authorization required"
                          my="md"
                          checked={isAuthorizationRequired}
                          onChange={(event) =>
                            setIsAuthorizationRequired(
                              event.currentTarget.checked
                            )
                          }
                        />

                        {/* <Select
                  my="md"
                  label="Funding Authorization Required By"
                  withAsterisk
                  data={['React', 'Angular', 'Vue', 'Svelte']}
                /> */}

                        <Group mt="lg" grow>
                          <Button
                            onClick={close}
                            variant="outline"
                            color="myColor"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={onSubmitSettlement}
                            variant="primary"
                          >
                            Proceed
                          </Button>
                        </Group>
                      </Modal>
                    </>
                  )}
                </>
              )}
            </Tabs.Panel>
          </>
        )}
      </Tabs>
    </>
  );
};

export default RiskFilters;
