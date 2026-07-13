import {
  Accordion,
  ActionIcon,
  Button,
  Grid,
  Group,
  Paper,
  Radio,
  SegmentedControl,
  Select,
  Stack,
  Tabs,
  Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconChevronLeft,
  IconCircleCheck,
  IconCircleX,
  IconInfoCircle,
} from '@tabler/icons-react';
import axios from 'axios';
import { BASE_URL } from 'constants/constant';
import { countries } from 'constants/countries';
import { ADMIN } from 'constants/routes';
import React, { FC, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const RiskScoringSurvey = () => {
  const { organizationId, applicationNo } = useParams(); // Extract the ID from the URL
  const navigate = useNavigate();
  const [selectedSegment, setSelectedSegment] = useState<string>('riskFactor');

  const [riskFactorData, setRiskFactorData] = useState<any>();
  const [highRiskFactorData, setHighRiskFactorData] = useState<any>();
  const [activeTab, setActiveTab] = useState<string | null>('');
  const [riskModelNumber, setRiskModelNumber] = useState<string | null>(null);

  useEffect(() => {
    fetchApplicationNumberScoring();
  }, []);

  const onClickRedirectBackToRiskTab = () => {
    // Redirect to the view page with the row ID
    navigate(
      ADMIN.ORGANIZATIONVIEW.replace(
        ':organizationId',
        organizationId as string
      ) + `?tab=risk`
    );
  };

  const fetchApplicationNumberScoring = () => {
    axios
      .get(
        `${BASE_URL}/risk-operation/api/risk-application-scoring/${applicationNo}`
      )
      .then((resp) => {
        const responseData = resp.data.data;
        setRiskModelNumber(responseData.riskModelNumber);
        fetchHighRiskFactors(responseData.riskModelNumber);
        fetchRiskFactors(responseData.riskModelNumber);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const fetchHighRiskFactors = async (riskModelNumber: string) => {
    try {
      axios
        .get(
          `${BASE_URL}/risk-operation/api/risk-high-classification-factor/${riskModelNumber}`
        )
        .then((resp) => {
          const data = resp.data.data;

          setHighRiskFactorData(data);

          fetchHighRiskScoring();
        });
    } catch (error) {
      console.error(
        `Error fetching highriskModelId data for ID: ${riskModelNumber}:`,
        error
      );
      // Show error notification (with "once" to prevent duplication)
      notifications.show({
        id: 'fetch-error', // Unique ID to ensure it displays only once
        title: 'Error',
        message: 'Failed to fetched high risk model',
        color: 'red',
        autoClose: 2000,
      });
    }
  };

  const fetchHighRiskScoring = async () => {
    try {
      axios
        .get(
          `${BASE_URL}/risk-operation/api/risk-high-classification-scoring/${applicationNo}`
        )
        .then((resp) => {
          const data = resp.data.data;
          if (data.total > 0) {
            const riskHighClassificationFactorIds =
              data.riskHighClassificationFactors.map(
                (factor: any) => factor.riskHighClassificationFactorId
              );
            setHighRiskFactorData((prevData: any) =>
              prevData.map((factor: any) => ({
                ...factor,
                value: riskHighClassificationFactorIds.includes(factor.id)
                  ? 'yes'
                  : 'no',
              }))
            );
          } else {
            setHighRiskFactorData((prevData: any) =>
              prevData.map((factor: any) => ({ ...factor, value: 'no' }))
            );
          }
        });
    } catch (error) {
      console.error(
        `Error fetching highriskModelScoring data for ID: ${applicationNo}:`,
        error
      );
      // Show error notification (with "once" to prevent duplication)
      notifications.show({
        id: 'fetch-error', // Unique ID to ensure it displays only once
        title: 'Error',
        message: 'Failed to fetched high risk scoring',
        color: 'red',
        autoClose: 2000,
      });
    }
  };

  const fetchRiskFactors = async (riskModelNumber: string, tabNum = 0) => {
    try {
      axios
        .get(`${BASE_URL}/risk-operation/api/risk-factor/${riskModelNumber}`, {
          params: {
            includeRiskFactorScoring: true,
          },
        })
        .then((resp) => {
          const data = resp.data.data;
          data.forEach((factor: any) => {
            if (factor.hasSubFactor) {
              factor.subFactors.forEach((subFactor: any) => {
                if (subFactor.hasSubFactor) {
                  subFactor.subFactors.forEach((subSubFactor: any) => {
                    if (subSubFactor.isRequireEvaluationParameter) {
                      subSubFactor.riskEvaluationParameters.forEach(
                        (param: any) => {
                          if (param.isSelected) {
                            subSubFactor.isAnswer = true;
                          }
                        }
                      );
                    }
                  });
                } else if (subFactor.isRequireEvaluationParameter) {
                  subFactor.riskEvaluationParameters.forEach((param: any) => {
                    if (param.isSelected) {
                      subFactor.isAnswer = true;
                    }
                  });
                }
              });
            } else if (factor.isRequireEvaluationParameter) {
              factor.riskEvaluationParameters.forEach((param: any) => {
                if (param.isSelected) {
                  factor.isAnswer = true;
                }
              });
            }
          });

          setRiskFactorData(data);
          setActiveTab(data[tabNum]?.tabName);
        });
    } catch (error) {
      console.error(
        `Error fetching riskModelId data for ID: ${riskModelNumber}:`,
        error
      );
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

  const onSaveRiskScoring = (tabData: any, tabIndex: number) => {
    const payload = {
      riskModelNumber: riskModelNumber,
      riskScoringSurveyData: tabData,
    };

    if (payload.riskScoringSurveyData.hasSubFactor) {
      payload.riskScoringSurveyData.riskFactorId = tabData.id;
      payload.riskScoringSurveyData.subFactors =
        payload.riskScoringSurveyData.subFactors.map((item: any) => {
          if (item.hasSubFactor) {
            return {
              ...item,
              riskFactorId: item.id,
              subFactors: item.subFactors.map((subItem: any) => {
                return {
                  ...subItem,
                  riskFactorId: subItem.id,
                };
              }),
            };
          }
          return {
            ...item,
            riskFactorId: item.id,
          };
        });
    } else {
      payload.riskScoringSurveyData = payload.riskScoringSurveyData.map(
        (item: any) => {
          return {
            ...item,
            riskFactorId: item.id,
          };
        }
      );
    }

    try {
      axios
        .post(
          `${BASE_URL}/risk-operation/api/risk-factor-scoring/${applicationNo}/store-risk-scores`,
          payload
        )
        .then((resp) => {
          const data = resp.data.data;

          fetchRiskFactors(riskModelNumber as string, tabIndex);

          notifications.show({
            title: 'Success',
            message: 'Save Successfully',
            color: 'green',
            autoClose: 5000,
          });
        });
    } catch (error) {
      console.error(
        `Error saving risk factors scoring for ID: ${applicationNo}:`,
        error
      );
      // Show error notification (with "once" to prevent duplication)
      notifications.show({
        id: 'fetch-error', // Unique ID to ensure it displays only once
        title: 'Error',
        message: 'Failed to save risk factors scoring',
        color: 'red',
        autoClose: 2000,
      });
    }
  };

  const onSaveHighRiskScoring = () => {
    const payload = {
      riskFactors: highRiskFactorData
        .filter((factor: any) => factor.value === 'yes')
        .map((factor: any) => factor.riskFactor),
    };

    try {
      axios
        .post(
          `${BASE_URL}/risk-operation/api/risk-high-classification-scoring/${applicationNo}`,
          payload
        )
        .then((resp) => {
          const data = resp.data.data;

          notifications.show({
            title: 'Success',
            message: 'Save Successfully',
            color: 'green',
            autoClose: 5000,
          });
        });
    } catch (error) {
      console.error(
        `Error saving high risk factors scoring for ID: ${applicationNo}:`,
        error
      );
      // Show error notification (with "once" to prevent duplication)
      notifications.show({
        id: 'fetch-error', // Unique ID to ensure it displays only once
        title: 'Error',
        message: 'Failed to save high risk factors scoring',
        color: 'red',
        autoClose: 2000,
      });
    }
  };

  const setSelectedRadioValue = (value: any, index: number) => {
    setHighRiskFactorData((prev: any) => {
      const newValues = [...prev];
      newValues[index].value = value; // Update only the changed index
      return newValues;
    });
  };

  const setLabelSelectionValue = (value: string, tabData: any) => {
    const selectedParam = tabData.riskEvaluationParameters.find(
      (param: any) => param.fixedScore === +value
    );

    tabData.score = +value;
    tabData.selectedEvaluationParamId = selectedParam.id;
    setRiskFactorData((prevData: any) =>
      prevData.map((tab: any) =>
        tab.tabName !== '' && tab.tabName === tabData.tabName
          ? {
              ...tab,
              subFactors: tab.subFactors.map((factor: any) =>
                factor.id === tabData.id
                  ? {
                      ...factor,
                      score: value,
                      selectedEvaluationParamId: selectedParam.id,
                    }
                  : factor
              ),
            }
          : tab
      )
    );
  };

  const onCompleteRiskScoring = () => {
    axios
      .patch(
        `${BASE_URL}/risk-operation/api/risk-factor-scoring/${applicationNo}/mark-complete`
      )
      .then((resp) => {
        const data = resp.data.data;

        notifications.show({
          title: 'Success',
          message: 'Survey Finished Successfully',
          color: 'green',
          autoClose: 5000,
        });

        navigate(
          ADMIN.ORGANIZATIONVIEW.replace(
            ':organizationId',
            organizationId as string
          ) + `?tab=risk`
        );
      })
      .catch((error) => {
        console.error(
          `Error finishing survey for ID: ${applicationNo}:`,
          error
        );
        // Show error notification (with "once" to prevent duplication)
        notifications.show({
          id: 'fetch-error', // Unique ID to ensure it displays only once
          title: 'Error',
          message: 'Failed to finish survey',
          color: 'red',
          autoClose: 2000,
        });
      });
  };

  const getScoreValue = (item: any) => {
    const selectedParam = item.riskEvaluationParameters.find(
      (param: any) => param.isSelected
    );
    if (selectedParam) {
      item.score = selectedParam.fixedScore;
    }

    return item.score;
  };

  const getFactorCompleteStatus = (tab: any) => {
    if (tab.hasSubFactor) {
      const allFactorsComplete = tab.subFactors.every((factor: any) => {
        if (factor.hasSubFactor) {
          return factor.subFactors.every(
            (subFactor: any) => subFactor.isAnswer == true
          );
        }
        return factor.isAnswer == true;
      });

      if (allFactorsComplete) {
        return <IconCircleCheck size={20} color="green" />;
      }
    } else {
      const questionComplete = tab.isAnswer == true;

      if (questionComplete) {
        return <IconCircleCheck size={20} color="green" />;
      }
    }

    return <IconCircleX size={20} color="red" />;
  };

  return (
    <div className="min-h-screen px-[5%] py-4">
      <div>
        <Button
          variant="transparent"
          className="w-full md:w-auto text-xs -mx-4"
          style={{
            color: '#000000',
          }}
          leftSection={<IconChevronLeft size={18} />}
          onClick={onClickRedirectBackToRiskTab}
        >
          Back to Risk
        </Button>
      </div>

      <div className="py-5 flex justify-between items-center">
        <div>
          <Text size="xl" fw={700}>
            Risk Scoring Survey
          </Text>
          <Text size="sm">
            Complete the scoring of key risk factors to determine applicant’s
            overall risk level.
          </Text>
        </div>

        <Button
          variant="primary"
          className="w-full md:w-auto"
          onClick={onCompleteRiskScoring}
        >
          Finish survey
        </Button>
      </div>

      {riskFactorData && (
        <>
          <SegmentedControl
            value={selectedSegment}
            onChange={setSelectedSegment}
            data={[
              { label: 'Risk Factor', value: 'riskFactor' },
              {
                label: 'Straight High Risk Classification',
                value: 'straightHigh',
              },
            ]}
            my="md"
          />
          {selectedSegment === 'straightHigh' && (
            <>
              {highRiskFactorData.length > 0 && (
                <>
                  {highRiskFactorData.map((highFactor: any, index: number) => (
                    <Paper withBorder p="sm" my="md" key={highFactor.id}>
                      <Text fw={700}>{highFactor.riskFactor}</Text>
                      <Text>{highFactor.description}</Text>

                      <Radio.Group
                        my="md"
                        value={highFactor.value}
                        onChange={(value) =>
                          setSelectedRadioValue(value, index)
                        }
                      >
                        <Group mt="xs">
                          <Radio value="yes" label="Yes" />
                          <Radio value="no" label="No" />
                        </Group>
                      </Radio.Group>
                    </Paper>
                  ))}

                  <div className="flex justify-end">
                    <Group mt="lg">
                      <Button onClick={onSaveHighRiskScoring} variant="primary">
                        Save
                      </Button>
                    </Group>
                  </div>
                </>
              )}
            </>
          )}

          {selectedSegment === 'riskFactor' && (
            <>
              {activeTab == '' && (
                <>
                  {riskFactorData.map((factor: any) => (
                    <Paper withBorder p="sm" my="md" key={factor.id}>
                      <Group justify="space-between">
                        <div>
                          <Text fw={700} size="sm">
                            {factor.riskFactorName}
                          </Text>
                        </div>

                        <div>
                          <ActionIcon variant="filled" aria-label="Activity">
                            <IconInfoCircle size={16} stroke={1.5} />
                          </ActionIcon>
                        </div>
                      </Group>

                      {factor.scoreMethod === 'LABEL_SELECTION' && (
                        <Radio.Group
                          value={factor.score}
                          onChange={(value) =>
                            setLabelSelectionValue(value, factor)
                          }
                          label="Select one of the following"
                        >
                          <Stack gap="md" mt="md">
                            {factor.isRequireEvaluationParameter &&
                              factor.riskEvaluationParameters?.map(
                                (param: any) => (
                                  <Radio
                                    key={param.id}
                                    value={param.fixedScore ?? ''}
                                    label={param.name}
                                  />
                                )
                              )}
                          </Stack>
                        </Radio.Group>
                      )}

                      {factor.scoreMethod === 'DROPDOWN_SELECTION' && (
                        <Grid>
                          <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
                            <Select
                              my="md"
                              data={factor.riskEvaluationParameters?.map(
                                (param: any) => ({
                                  label: param.name,
                                  value: param.fixedScore.toString(),
                                })
                              )}
                              value={factor.score}
                              onChange={(value) =>
                                setLabelSelectionValue(value as string, factor)
                              }
                            />
                          </Grid.Col>
                        </Grid>
                      )}

                      {factor.scoreMethod === 'COUNTRY_SELECTION' && (
                        <Grid>
                          <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
                            <Select
                              my="md"
                              data={countries?.map((param) => ({
                                label: param.name,
                                value: param.name,
                              }))}
                            />
                          </Grid.Col>
                        </Grid>
                      )}

                      {factor.scoreMethod === 'NUMERIC_SCORING' && (
                        <Grid>
                          <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
                            <Select
                              my="md"
                              data={countries?.map((param) => ({
                                label: param.name,
                                value: param.name,
                              }))}
                            />
                          </Grid.Col>
                        </Grid>
                      )}
                    </Paper>
                  ))}

                  <div className="flex justify-end">
                    <Group mt="lg">
                      <Button
                        onClick={() => onSaveRiskScoring(riskFactorData, 0)}
                        variant="primary"
                      >
                        Save
                      </Button>
                    </Group>
                  </div>
                </>
              )}
              {activeTab !== '' && (
                <Tabs
                  value={activeTab}
                  onChange={setActiveTab}
                  defaultValue={riskFactorData[0]?.tabName}
                >
                  <Tabs.List>
                    {riskFactorData.map((tab: any) => (
                      <Tabs.Tab
                        key={tab.tabName}
                        value={tab.tabName}
                        rightSection={getFactorCompleteStatus(tab)}
                      >
                        {tab.tabName}
                      </Tabs.Tab>
                    ))}
                  </Tabs.List>
                  <Text size="sm" my="md" style={{ color: '#777777' }}>
                    Please ensure all changes are saved to prevent any potential
                    loss of progress. Click 'Finish Survey' to complete the
                    survey and automatically view the risk results.
                  </Text>

                  {riskFactorData.map((tab: any, tabIndex: number) => (
                    <Tabs.Panel key={tab.tabName} value={tab.tabName} mt="md">
                      {tab.subFactors.map((factor: any) => (
                        <Paper withBorder p="sm" my="md" key={factor.id}>
                          <Group justify="space-between">
                            <div>
                              <Text fw={700} size="sm">
                                {factor.riskFactorName}
                              </Text>
                            </div>

                            <div>
                              <ActionIcon
                                variant="filled"
                                aria-label="Activity"
                              >
                                <IconInfoCircle size={16} stroke={1.5} />
                              </ActionIcon>
                            </div>
                          </Group>

                          {!factor.hasSubFactor && (
                            <>
                              {factor.scoreMethod === 'LABEL_SELECTION' && (
                                <Radio.Group
                                  value={factor.score}
                                  onChange={(value) =>
                                    setLabelSelectionValue(value, factor)
                                  }
                                  label="Select one of the following"
                                >
                                  <Stack gap="md" mt="md">
                                    {factor.isRequireEvaluationParameter &&
                                      factor.riskEvaluationParameters?.map(
                                        (param: any) => (
                                          <Radio
                                            key={param.id}
                                            value={param.fixedScore ?? ''}
                                            label={param.name}
                                          />
                                        )
                                      )}
                                  </Stack>
                                </Radio.Group>
                              )}

                              {factor.scoreMethod === 'DROPDOWN_SELECTION' && (
                                <Grid>
                                  <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
                                    <Select
                                      my="md"
                                      data={factor.riskEvaluationParameters?.map(
                                        (param: any) => ({
                                          label: param.name,
                                          value: param.name,
                                        })
                                      )}
                                    />
                                  </Grid.Col>
                                </Grid>
                              )}

                              {factor.scoreMethod === 'COUNTRY_SELECTION' && (
                                <Grid>
                                  <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
                                    <Select
                                      my="md"
                                      data={countries?.map((param) => ({
                                        label: param.name,
                                        value: param.name,
                                      }))}
                                    />
                                  </Grid.Col>
                                </Grid>
                              )}

                              {factor.scoreMethod === 'NUMERIC_SCORING' && (
                                <Grid>
                                  <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
                                    <Select
                                      my="md"
                                      data={countries?.map((param) => ({
                                        label: param.name,
                                        value: param.name,
                                      }))}
                                    />
                                  </Grid.Col>
                                </Grid>
                              )}
                            </>
                          )}

                          {factor.hasSubFactor && (
                            <Accordion
                              variant="contained"
                              defaultValue={factor.subFactors[0].id.toString()}
                              my="md"
                            >
                              {factor.subFactors &&
                                factor.subFactors.map((item: any) => (
                                  <Accordion.Item
                                    key={item.id}
                                    value={item.id.toString()}
                                  >
                                    <Accordion.Control
                                      icon={getFactorCompleteStatus(item)}
                                    >
                                      {item.riskFactorName}
                                    </Accordion.Control>
                                    <Accordion.Panel>
                                      {item.scoreMethod ===
                                        'LABEL_SELECTION' && (
                                        <Radio.Group
                                          value={getScoreValue(item)}
                                          onChange={(value) =>
                                            setLabelSelectionValue(value, item)
                                          }
                                          label="Select one of the following"
                                        >
                                          <Stack gap="md" mt="md">
                                            {item.isRequireEvaluationParameter &&
                                              item.riskEvaluationParameters.map(
                                                (param: any) => (
                                                  <Radio
                                                    key={param.id}
                                                    value={
                                                      param.fixedScore ?? ''
                                                    }
                                                    label={param.name}
                                                  />
                                                )
                                              )}
                                          </Stack>
                                        </Radio.Group>
                                      )}
                                    </Accordion.Panel>
                                  </Accordion.Item>
                                ))}
                            </Accordion>
                          )}
                        </Paper>
                      ))}

                      <div className="flex justify-end">
                        <Group mt="lg">
                          <Button
                            onClick={() => onSaveRiskScoring(tab, tabIndex)}
                            variant="primary"
                          >
                            Save {tab.tabName}
                          </Button>
                        </Group>
                      </div>
                    </Tabs.Panel>
                  ))}
                </Tabs>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default RiskScoringSurvey;
