import React, { FC, useEffect, useState } from 'react';
import { PieChart } from '@mantine/charts';
import {
  Flex,
  Text,
  Button,
  Group,
  Paper,
  ActionIcon,
  Stack,
  RingProgress,
  Grid,
  useMantineTheme,
  Tabs,
  ScrollArea,
  Badge,
  AspectRatio,
} from '@mantine/core';
import {
  IconActivity,
  IconAdjustments,
  IconAlertCircle,
  IconAlertTriangle,
  IconChartPie,
  IconClock,
  IconEye,
  IconFileDownload,
  IconReport,
} from '@tabler/icons-react';
import BusinessStability from './Filter1Tabs/BusinessStability';
import AssetManagement from './Filter1Tabs/AssetManagement';
import LiquidityMeasures from './Filter1Tabs/LiquidityMeasures';
import Leverage from './Filter1Tabs/Leverage';
import Coverage from './Filter1Tabs/Coverage';
import { useNavigate } from 'react-router-dom';
import { ADMIN } from 'constants/routes';
import { RiskFilter1ScoreProps } from './RiskFilters';
import { RiskLevelColorEnum } from 'constants/enum';
import axios from 'axios';
import { BASE_URL } from 'constants/constant';
import { notifications } from '@mantine/notifications';
import {
  formatDateDDMMYYYY,
  formatDateDDMMYYYYwithTime,
} from 'service/formatDate';
import { downloadFile } from 'service/file';

interface RiskFilter1Props {
  selectedApplicationNumber: string;
  organizationId: string;
  riskFilter1Score: RiskFilter1ScoreProps | null;
}

const RiskFilter1: FC<RiskFilter1Props> = ({
  selectedApplicationNumber,
  organizationId,
  riskFilter1Score,
}) => {
  const theme = useMantineTheme();
  const [activeTab, setActiveTab] = useState<string | null>(
    'businessStability'
  );
  const [pieChartdata, setPieChartdata] = useState<any[]>([
    { name: '', value: 100, color: 'gray.3' },
  ]);
  const [riskPortfolioScore, setRiskPortfolioScore] = useState<string>('0');
  const [riskPortfolioColor, setRiskPortfolioColor] = useState<string>(
    'rgba(24, 161, 83, 1)'
  );
  const [updatedAt, setUpdatedAt] = useState<string | null>('4 Apr 2025');
  const [riskStatus, setRiskStatus] = useState<string>('');
  const [riskThresholdProfile, setRiskThresholdProfile] = useState<
    string | null
  >('DEFAULT');
  const [riskCategory, setRiskCategory] = useState<string | null>('');

  const [auditData, setAuditData] = useState<any[]>([]);

  const [alertData, setAlertData] = useState<any[]>([]);

  const [financialCreditReportData, setFinancialCreditReportData] = useState<
    any[]
  >([]);

  const [assetManagementList, setAssetManagementList] = useState<any[]>([]);
  const [liquidityMeasuresList, setLiquidityMeasuresList] = useState<any[]>([]);

  const [leverageList, setLeverageList] = useState<any[]>([]);
  const [coverageList, setCoverageList] = useState<any[]>([]);

  const [manualReviewStatus, setManualReviewStatus] = useState<boolean>(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchRiskParamWeightData();
    fetchFinancialCreditReportData();
    fetchAuditLog();
    fetchAlertData();

    if (riskFilter1Score) {
      setRiskPortfolioScore(riskFilter1Score.totalScoreRiskFilter1 as string);
      setRiskPortfolioColor(
        riskColor(riskFilter1Score.riskFilter1Category as string)
      );
      setUpdatedAt(
        formatDateDDMMYYYY(riskFilter1Score.riskFilter1LastUpdatedAt as string)
      );
      setRiskStatus(riskFilter1Score.riskFilter1Status as string);
      setRiskCategory(riskFilter1Score.riskFilter1Category as string);
      setRiskThresholdProfile(riskFilter1Score.riskProfileCode);
    }
  }, [riskFilter1Score]);

  const onViewThresholds = () => {
    navigate({
      pathname: ADMIN.THRESHOLDRISKPROFILESVIEW.replace(
        ':riskProfileCode',
        riskThresholdProfile as string
      ),
      search: `?tab=risk&organization=${organizationId}&application=${selectedApplicationNumber}&riskProfileCode=${riskThresholdProfile}`,
    });
  };

  const getListAuditTrail = () => {
    return auditData.length !== 0 ? (
      auditData.map((item, index) => (
        <div
          key={index}
          className="mb-5 p-3 border rounded-lg border-[#E4E4E7] min-w-[200px]"
        >
          <Text size="sm" fw={700} c="rgba(151,158,164,1)" mb={5}>
            {formatDateDDMMYYYYwithTime(item.createdAt)}
          </Text>
          <Text size="sm" fw={700} mb={5}>
            {item.performedBy}
          </Text>
          <Text size="sm">{item.details}</Text>
        </div>
      ))
    ) : (
      <div className="min-w-[200px]">No Action</div>
    );
  };

  const getListAlerts = () => {
    return alertData.length !== 0 ? (
      alertData.map((item, index) => (
        <div className="mb-5 p-3 bg-[#FDEAEB]" key={index}>
          <Flex gap={5} align="flex-start">
            <div className="bg-[#FA5252] min-w-[24px] h-[24px] rounded-xl flex items-center justify-center">
              <IconAlertCircle size={16} stroke={1.5} className="text-white" />
            </div>

            <div>
              <Text fw={700} size="xs">
                {item.quantitativeParameterName}
              </Text>
              <Text size="xs">{item.message}</Text>
            </div>
          </Flex>
        </div>
      ))
    ) : (
      <div className="min-w-[200px]">No Alert</div>
    );
  };

  const onStartManualReview = () => {
    console.log('Start Manual Review');

    const apiRequestBody = {
      applicationNumber: selectedApplicationNumber,
      performedBy: 'John Doe (Analyst)',
      actionType: 'MANUAL_REVIEW_STARTED',
    };

    axios
      .post(
        `${BASE_URL}/risk-operation/api/risk-application-audit-log`,
        apiRequestBody
      )
      .then((resp) => {
        fetchAuditLog();
        setManualReviewStatus(true);
      })
      .catch((error) => {
        console.log(error);
      });
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
        name: item.parameterName,
        value: Number(item.weight),
        color: getRandomColor(),
      };
    });

    if (remaining !== 0) {
      scoreData.push({ name: 'Unassign', value: remaining, color: 'gray.3' });
    }

    setPieChartdata(scoreData);
  };

  const fetchAuditLog = async () => {
    axios
      .get(
        `${BASE_URL}/risk-operation/api/risk-application-audit-log/${selectedApplicationNumber}`
      )
      .then((resp) => {
        const responseData = resp.data.data;
        setAuditData(responseData);
      })
      .catch((error) => {
        console.log(error);
        notifications.show({
          id: 'fetch-error', // Unique ID to ensure it displays only once
          title: 'Error',
          message: error.response.data.message,
          color: 'red',
          autoClose: 2000,
        });
      });
  };

  const fetchAlertData = async () => {
    axios
      .get(
        `${BASE_URL}/risk-operation/api/risk-manual-review-alert/${selectedApplicationNumber}`
      )
      .then((resp) => {
        const responseData = resp.data.data;
        setAlertData(responseData);
      })
      .catch((error) => {
        console.log(error);
        notifications.show({
          id: 'fetch-error', // Unique ID to ensure it displays only once
          title: 'Error',
          message: error.response.data.message,
          color: 'red',
          autoClose: 2000,
        });
      });
  };

  const fetchRiskParamWeightData = async () => {
    axios
      .get(
        `${BASE_URL}/risk-operation/api/risk-quantitative-profile-scoring/${selectedApplicationNumber}`
      )
      .then((resp) => {
        const responseData = resp.data.data;
        updateScoreWeight(responseData.quantitativeParameters);
      })
      .catch((error) => {
        console.log(error);
        notifications.show({
          id: 'fetch-error', // Unique ID to ensure it displays only once
          title: 'Error',
          message: error.response.data.message,
          color: 'red',
          autoClose: 2000,
        });
      });
  };

  const fetchFinancialCreditReportData = async () => {
    axios
      .get(
        `${BASE_URL}/risk-operation/api/financial-credit-report/${organizationId}`
      )
      .then((resp) => {
        setAssetManagementList(resp.data.assetManagement);
        setLiquidityMeasuresList(resp.data.liquidityMeasures);
        setLeverageList(resp.data.leverage);
        setCoverageList(resp.data.coverage);
        setFinancialCreditReportData(resp.data.financialCreditReport);
      });
  };

  const riskColor = (riskCategory: string) => {
    let result = RiskLevelColorEnum.LOW_RISK;
    switch (riskCategory) {
      case 'LOW':
        result = RiskLevelColorEnum.LOW_RISK;
        break;
      case 'MEDIUM':
        result = RiskLevelColorEnum.MEDIUM_RISK;
        break;
      case 'HIGH':
        result = RiskLevelColorEnum.HIGH_RISK;
        break;
    }

    return result;
  };

  const getRiskStatusBadgeColor = (riskStatus: string) => {
    let result = 'blue';
    switch (riskStatus) {
      case 'APPROVED':
        result = 'green';
        break;
      case 'REJECTED':
        result = 'red';
        break;
      case 'PENDING_MANUAL_REVIEW':
        result = 'blue';
        break;
    }

    return result;
  };

  const onDownloadDocumentClick = () => {
    //TODO: Change document name and path
    const bucketName = 'dev.organization.document.sqf.ai';
    const pathAfterTrim = 'demo company/Aero Network & Technologies_ECI.pdf';
    axios
      .get(
        `${BASE_URL}/risk-operation/api/financial-credit-report/document/${bucketName}//${pathAfterTrim}`,
        {
          responseType: 'blob',
        }
      )
      .then((resp) => {
        downloadFile(resp.data, 'Berjaya_Holdings_ECI_Report.pdf');
      });
  };

  const updateRiskFilter1Status = (status: string) => {
    const apiRequestBody = {
      status: status,
      updatedBy: 'John Doe (Analyst)',
    };

    axios
      .patch(
        `${BASE_URL}/risk-operation/api/risk-application-scoring/${selectedApplicationNumber}/risk-filter-1-status`,
        apiRequestBody
      )
      .then((resp) => {
        fetchAlertData();
        fetchAuditLog();
        setRiskStatus(status);
        notifications.show({
          title: 'Success',
          message: 'Risk Filter 1 Status had been updated successfully.',
          color: 'green',
        });
      })
      .catch((error) => {
        console.log(error);
        notifications.show({
          id: 'fetch-error', // Unique ID to ensure it displays only once
          title: 'Error',
          message: 'Failed to update Risk Filter 1 Status',
          color: 'red',
          autoClose: 2000,
        });
      });
  };

  const onRerunThresholdsCheck = () => {
    axios
      .post(
        `${BASE_URL}/risk-operation/api/risk-manual-review-alert/${selectedApplicationNumber}/regenerate`
      )
      .then((resp) => {
        fetchAlertData();
        notifications.show({
          title: 'Success',
          message: 'Threshold Check had been re-run successfully.',
          color: 'green',
        });
      })
      .catch((error) => {
        console.log(error);
        notifications.show({
          id: 'fetch-error', // Unique ID to ensure it displays only once
          title: 'Error',
          message: 'Failed to re-run threshold check',
          color: 'red',
          autoClose: 2000,
        });
      });
  };

  return (
    <div>
      <Flex justify="space-between" className="mb-5">
        <div>
          <Text fw={700}>Risk Filter #1</Text>
        </div>

        {manualReviewStatus && alertData.length !== 0 && (
          <Flex gap="10px">
            <Button
              variant="filled"
              color="green"
              onClick={() => updateRiskFilter1Status('APPROVED')}
            >
              Approve
            </Button>
            <Button
              variant="filled"
              color="red"
              onClick={() => updateRiskFilter1Status('REJECTED')}
            >
              Reject
            </Button>
          </Flex>
        )}
      </Flex>

      <Flex gap="md" className="mb-5">
        <Stack gap="md">
          <Flex gap="md">
            {/* Overall Quantitative Risk Score */}
            <Paper shadow="sm" p="lg" radius="md" style={{ display: 'flex' }}>
              <div className="flex flex-col justify-between">
                <Flex justify="space-between">
                  <div>
                    <Text fw={700} size="sm" c="rgba(146,145,165,1)">
                      Statistics
                    </Text>

                    <Text fw={700} size="xs">
                      Overall Quantitative Risk Score
                    </Text>
                  </div>

                  <div className="flex items-center">
                    <ActionIcon
                      variant="outline"
                      radius="xl"
                      aria-label="Activity"
                    >
                      <IconActivity size={16} stroke={1.5} />
                    </ActionIcon>
                  </div>
                </Flex>

                <Flex>
                  <RingProgress
                    size={200}
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
                  <div className="content-center w-max p-4">
                    <Text size="xl" fw={700} className="capitalize">
                      {riskCategory?.toLowerCase()} Risk
                    </Text>
                    <Badge
                      color={getRiskStatusBadgeColor(riskStatus)}
                      variant="light"
                      size="sm"
                      radius="sm"
                    >
                      {riskStatus}
                    </Badge>
                  </div>
                </Flex>
                <Text size="xs">Last updated on {updatedAt}</Text>
              </div>
            </Paper>

            {/* Quantitative Risk Parameters Weightage  */}
            <Paper
              shadow="sm"
              p="lg"
              radius="md"
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <Group justify="space-between">
                <div>
                  <Text fw={700} size="sm" c="rgba(146,145,165,1)">
                    Statistics
                  </Text>

                  <Text fw={700} size="xs">
                    Quantitative Risk Parameters Weightage
                  </Text>
                </div>

                <div>
                  <ActionIcon
                    variant="outline"
                    radius="xl"
                    aria-label="Activity"
                  >
                    <IconChartPie size={16} stroke={1.5} />
                  </ActionIcon>
                </div>
              </Group>

              <Flex>
                <RingProgress
                  size={220}
                  thickness={30}
                  sections={pieChartdata}
                />
                <Grid className="content-center" p={10}>
                  {pieChartdata.map((data, index) => (
                    <Grid.Col span={{ base: 12 }} key={index}>
                      <Flex align="center" gap={10}>
                        <div
                          style={{
                            backgroundColor: data.color,
                            minWidth: 10,
                            height: 10,
                          }}
                        ></div>
                        <Text size="xs">{data.name}</Text> -
                        <Text size="xs" fw={700}>
                          {data.value}%
                        </Text>
                      </Flex>
                    </Grid.Col>
                  ))}
                </Grid>
              </Flex>
            </Paper>
          </Flex>

          <Flex gap="md">
            <Stack>
              {/* Quantitative Risk Parameters Breakdown Score */}
              <Paper shadow="sm" p="lg" radius="md">
                <Flex justify="space-between">
                  <div>
                    <Text fw={700} size="sm" c="rgba(146,145,165,1)">
                      Statistics
                    </Text>

                    <Text fw={700} size="xs">
                      Quantitative Risk Parameters Breakdown Score
                    </Text>
                  </div>

                  <div>
                    <ActionIcon
                      variant="outline"
                      radius="xl"
                      aria-label="Activity"
                    >
                      <IconChartPie size={16} stroke={1.5} />
                    </ActionIcon>
                  </div>
                </Flex>

                <Flex gap={10}>
                  <AspectRatio ratio={6 / 5}>
                    <PieChart
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
                  </AspectRatio>

                  <Grid className="content-center">
                    {pieChartdata.map((data, index) => (
                      <Grid.Col span={{ base: 12 }} key={index}>
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
                </Flex>
              </Paper>

              {/* Threshold Breach Triggers */}
              <Paper shadow="sm" p="lg" radius="md">
                <Group justify="space-between" mb={10}>
                  <div>
                    <Text fw={700} size="sm" c="rgba(146,145,165,1)">
                      Risk Flags
                    </Text>

                    <Text fw={700} size="xs">
                      Threshold Breach Triggers
                    </Text>
                  </div>

                  <div>
                    <ActionIcon
                      variant="outline"
                      radius="xl"
                      aria-label="Activity"
                    >
                      <IconAdjustments size={16} stroke={1.5} />
                    </ActionIcon>
                  </div>
                </Group>
                <Badge variant="light" color="blue" size="md" radius="md">
                  {riskThresholdProfile}
                </Badge>
                <div className="flex justify-end">
                  <Group mt="lg" gap="10px">
                    <Button onClick={onRerunThresholdsCheck} variant="outline">
                      Re-run Threshold Check
                    </Button>
                    <Button
                      onClick={onViewThresholds}
                      variant="primary"
                      rightSection={<IconEye size={16} />}
                    >
                      View Thresholds
                    </Button>
                  </Group>
                </div>
              </Paper>
            </Stack>

            <Paper shadow="sm" p="lg" radius="md">
              <Group justify="space-between" mb={10}>
                <div>
                  <Text fw={700} size="sm" c="rgba(146,145,165,1)">
                    Risk Flags
                  </Text>

                  <Text fw={700} size="xs">
                    Audit Trail
                  </Text>
                </div>

                <div>
                  <ActionIcon
                    variant="outline"
                    radius="xl"
                    aria-label="Activity"
                  >
                    <IconClock size={16} stroke={1.5} />
                  </ActionIcon>
                </div>
              </Group>
              <ScrollArea h={400}>{getListAuditTrail()}</ScrollArea>
            </Paper>
          </Flex>
        </Stack>

        <Stack>
          {/* Manual Review Alerts */}
          <Paper
            shadow="sm"
            p="lg"
            radius="md"
            style={{ display: 'flex', flex: '1' }}
          >
            <Flex gap="md" direction="column" className="flex-1">
              <Group justify="space-between" mb={10}>
                <div>
                  <Text fw={700} size="sm" c="rgba(146,145,165,1)">
                    Risk Flags
                  </Text>

                  <Text fw={700} size="xs">
                    Manual Review Alerts
                  </Text>
                </div>

                <div>
                  <ActionIcon
                    variant="outline"
                    radius="xl"
                    aria-label="Activity"
                  >
                    <IconAlertTriangle size={16} stroke={1.5} />
                  </ActionIcon>
                </div>
              </Group>

              <ScrollArea className="flex-1" h={400}>
                {getListAlerts()}
              </ScrollArea>

              <Button
                onClick={onStartManualReview}
                variant="primary"
                disabled={alertData.length == 0 || manualReviewStatus}
              >
                Start Manual Review
              </Button>
            </Flex>
          </Paper>

          <Paper shadow="sm" p="lg" radius="md">
            <Group justify="space-between" mb={10}>
              <div>
                <Text fw={700} size="sm" c="rgba(146,145,165,1)">
                  Credit Report
                </Text>

                <Text fw={700} size="xs">
                  Access Credit Report
                </Text>
              </div>

              <div>
                <ActionIcon variant="outline" radius="xl" aria-label="Activity">
                  <IconReport size={16} stroke={1.5} />
                </ActionIcon>
              </div>
            </Group>

            <Flex gap={10} my="md">
              <Text>Berjaya_Holdings_ECI_Report.pdf</Text>
              <ActionIcon
                variant="transparent"
                color="rgba(0, 0, 0, 1)"
                onClick={onDownloadDocumentClick}
              >
                <IconFileDownload stroke={1.5}></IconFileDownload>
              </ActionIcon>
            </Flex>
          </Paper>
        </Stack>
      </Flex>

      <Tabs value={activeTab} onChange={setActiveTab} variant="outline">
        <Tabs.List>
          <Tabs.Tab value="businessStability" style={{ fontSize: '13px' }}>
            Business Stability
          </Tabs.Tab>
          <Tabs.Tab value="assetManagement" style={{ fontSize: '13px' }}>
            Asset Management
          </Tabs.Tab>
          <Tabs.Tab value="liquidityMeasures" style={{ fontSize: '13px' }}>
            Liquidity Measures
          </Tabs.Tab>
          <Tabs.Tab value="leverage" style={{ fontSize: '13px' }}>
            Leverage
          </Tabs.Tab>
          <Tabs.Tab value="coverage" style={{ fontSize: '13px' }}>
            Coverage
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="businessStability">
          {activeTab === 'businessStability' && (
            <div className="mt-5">
              <BusinessStability
                financialCreditReportData={financialCreditReportData}
              />
            </div>
          )}
        </Tabs.Panel>
        <Tabs.Panel value="assetManagement">
          {activeTab === 'assetManagement' && (
            <div className="mt-5">
              <AssetManagement
                financialCreditReportData={financialCreditReportData}
                assetManagement={assetManagementList}
              />
            </div>
          )}
        </Tabs.Panel>
        <Tabs.Panel value="liquidityMeasures">
          {activeTab === 'liquidityMeasures' && (
            <div className="mt-5">
              <LiquidityMeasures
                financialCreditReportData={financialCreditReportData}
                liquidityMeasures={liquidityMeasuresList}
              />
            </div>
          )}
        </Tabs.Panel>
        <Tabs.Panel value="leverage">
          {activeTab === 'leverage' && (
            <div className="mt-5">
              <Leverage
                financialCreditReportData={financialCreditReportData}
                leverage={leverageList}
              />
            </div>
          )}
        </Tabs.Panel>
        <Tabs.Panel value="coverage">
          {activeTab === 'coverage' && (
            <div className="mt-5">
              <Coverage
                financialCreditReportData={financialCreditReportData}
                coverage={coverageList}
              />
            </div>
          )}
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default RiskFilter1;
