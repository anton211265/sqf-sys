import {
  ActionIcon,
  AspectRatio,
  BackgroundImage,
  Badge,
  Button,
  Card,
  Center,
  Divider,
  Group,
  List,
  LoadingOverlay,
  Menu,
  Modal,
  Progress,
  Space,
  Tabs,
  Text,
  TextInput,
  useMantineTheme,
} from '@mantine/core';
import {
  IconCheck,
  IconChevronLeft,
  IconDots,
  IconEye,
  IconX,
} from '@tabler/icons-react';
import { ADMIN } from 'constants/routes';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classes from './RiskModelView.module.css';

import { useDisclosure } from '@mantine/hooks';
import axios from 'axios';
import { BASE_URL } from 'constants/constant';
import { notifications } from '@mantine/notifications';
import cardBg from '../../../../../assets/img/cardBg.png';
import RiskClassificationThreshold from './Tabs/RiskClassificationThreshold';
import StraightHighRiskClassification from './Tabs/StraightHighRiskClassification';
import RiskFactor from './Tabs/RiskFactor';

interface IRiskModel {
  riskModelName: string;
  description: string;
  riskModelStatus: string;
}

const RiskModelView = () => {
  const { riskModelId } = useParams(); // Extract the ID from the URL

  const navigate = useNavigate();
  const [riskWeightProgressPercent, setRiskWeightProgressPercent] = useState(0);
  const [riskFactorData, setriskFactorData] = useState<any[]>([]);
  const [renameMode, setRenameMode] = useState<boolean>(false);
  const [opened, { open, close }] = useDisclosure(false); // publish modal
  const [publishedSuccessfulOpened, publishedSuccessfulActions] =
    useDisclosure(false); // publish modal

  const [lowRiskThresholds, setLowRiskThresholds] = useState<[number, number]>([
    0, 0,
  ]);
  const [mediumRiskThresholds, setMediumRiskThresholds] = useState<
    [number, number]
  >([0, 0]);
  const [highRiskThresholds, setHighRiskThresholds] = useState<
    [number, number]
  >([0, 0]);

  const [visible, setVisible] = useState<boolean>(false); // State for loader, calling toggle will switch the visible state from true to false or from false to true

  const [highRiskFactorData, setHighRiskFactorData] = useState<any[]>([]);
  const [riskModelDetail, setRiskModelDetail] = useState<IRiskModel>({
    riskModelName: '',
    description: '',
    riskModelStatus: '',
  });
  const [riskModelRenameDetail, setRiskModelRenameDetail] =
    useState<IRiskModel>({
      riskModelName: '',
      description: '',
      riskModelStatus: '',
    });

  const [pieChartdata, setPieChartdata] = useState<any[]>([
    { name: '', value: 100, color: 'gray.3' },
  ]);

  const theme = useMantineTheme();

  useEffect(() => {
    if (riskModelId) fetchRiskModel();
  }, [riskModelId]); // Dependency ensures this effect runs only when organizationId changes.

  const fetchRiskModel = async () => {
    try {
      axios
        .get(`${BASE_URL}/risk-operation/api/risk-model/${riskModelId}`)
        .then((resp) => {
          const data = resp.data.data;
          setRiskModelDetail({
            riskModelName: data.riskModelName,
            description: data.description,
            riskModelStatus: data.riskModelStatus,
          });

          setLowRiskThresholds(data.lowRiskThresholds);
          setMediumRiskThresholds(data.mediumRiskThresholds);
          setHighRiskThresholds(data.highRiskThresholds);

          updateScoreWeight(data.riskFactors);

          setriskFactorData(data.riskFactors);
          setHighRiskFactorData(data.riskHighClassificationFactors);
        });
    } catch (error) {
      console.error(
        `Error fetching riskModelId data for ID: ${riskModelId}:`,
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
    } finally {
      // setLoading(false); // Stop loading
    }
  };

  const handleCloseRefetch = (requiredRefetch: boolean) => {
    if (requiredRefetch) {
      fetchRiskModel();
    }
  };

  const getRandomColor = () => {
    const colors = Object.keys(theme.colors); // Get all Mantine colors
    const randomColor = colors[Math.floor(Math.random() * colors.length)]; // Pick a random color
    const randomShade = Math.floor(Math.random() * 10); // Pick a random shade from 0-9
    return theme.colors[randomColor][randomShade]; // Return the color with the random shade
    // return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  };

  const updateScoreWeight = (data: any) => {
    let remaining = 100;
    let total = 0;
    const scoreData = data.map((item: any) => {
      total += Number(item.weight);
      setRiskWeightProgressPercent(total);
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

  const onClickRedirectBackToRiskModelList = () => {
    navigate(ADMIN.RISKMODELS);
  };

  const onPublishRiskModel = () => {
    close();
    setVisible(true);
    try {
      axios
        .patch(
          `${BASE_URL}/risk-operation/api/risk-model/${riskModelId}/update-status`,
          {
            status: 'PUBLISHED',
          }
        )
        .then((resp) => {
          setVisible(false);
          publishedSuccessfulActions.open();
        });
    } catch (error) {
      console.error(
        `Error fetching riskModelId data for ID: ${riskModelId}:`,
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

  const statusColors: { [key: string]: string } = {
    DRAFT: 'blue',
    PUBLISHED: 'green',
    ARCHIVED: 'yellow',
  };

  const onRenameClick = () => {
    setRenameMode(true);
    setRiskModelRenameDetail(riskModelDetail);
  };

  const onCancelRenameMode = () => {
    setRenameMode(false);
  };

  const onRenameConfirm = () => {
    const payLoad = {
      riskModelName: riskModelRenameDetail.riskModelName,
      description: riskModelRenameDetail.description,
    };

    try {
      axios
        .patch(
          `${BASE_URL}/risk-operation/api/risk-model/${riskModelId}`,
          payLoad
        )
        .then((resp) => {
          const data = resp.data.data;
          setRiskModelDetail({
            riskModelName: data.riskModelName,
            description: data.description,
            riskModelStatus: data.riskModelStatus,
          });
        });
    } catch (error) {
      console.error(
        `Error fetching risk model data for ID: ${riskModelId}:`,
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
    setRenameMode(false);
  };

  const onDeleteClick = () => {
    try {
      axios
        .delete(`${BASE_URL}/risk-operation/api/risk-model/${riskModelId}`)
        .then((resp) => {
          navigate(ADMIN.RISKMODELS);
        });
    } catch (error) {
      console.error(
        `Error fetching riskModelId data for ID: ${riskModelId}:`,
        error
      );

      // Show error notification (with "once" to prevent duplication)
      notifications.show({
        id: 'fetch-error', // Unique ID to ensure it displays only once
        title: 'Error',
        message: 'Failed to delete risk model',
        color: 'red',
        autoClose: 2000,
      });
    }
  };

  return (
    <div className="min-h-screen px-[5%] py-4">
      <LoadingOverlay
        visible={visible}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
      />
      <div className="pb-8">
        <Button
          variant="transparent"
          className="w-full md:w-auto text-xs -mx-4"
          style={{
            color: '#000000',
          }}
          leftSection={<IconChevronLeft size={18} />}
          onClick={onClickRedirectBackToRiskModelList}
        >
          Back to Risk Model List
        </Button>
      </div>
      <div>
        <BackgroundImage src={cardBg} radius="md">
          <Card
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            style={{ backgroundColor: 'rgba(0,0,0,0)' }}
          >
            <div>
              <div className="flex justify-end">
                <Group mt="lg">
                  {/* <Button
                  // onClick={onPublishRiskModel}
                  variant="outline"
                  color="myColor"
                  leftSection={<IconEye />}
                >
                  Preview
                </Button> */}
                  {riskModelDetail.riskModelStatus === 'DRAFT' && (
                    <Button onClick={open} variant="primary">
                      Publish
                    </Button>
                  )}
                </Group>
              </div>
              <div className="py-3">
                <Badge
                  key={riskModelDetail.riskModelStatus}
                  color={statusColors[riskModelDetail.riskModelStatus]} // Fallback color for unknown personas
                  variant="filled"
                  size="md"
                  radius="md"
                >
                  {riskModelDetail.riskModelStatus}
                </Badge>
              </div>
              <div className="flex justify-between">
                <div>
                  {renameMode && (
                    <>
                      <TextInput
                        value={riskModelRenameDetail.riskModelName}
                        onChange={(event) =>
                          setRiskModelRenameDetail({
                            riskModelName: event.target.value,
                            description: riskModelRenameDetail.description,
                            riskModelStatus:
                              riskModelRenameDetail.riskModelStatus,
                          })
                        }
                        autoFocus
                      />
                      <Space h="md" />
                      <TextInput
                        value={riskModelRenameDetail.description}
                        onChange={(event) =>
                          setRiskModelRenameDetail({
                            riskModelName: riskModelRenameDetail.riskModelName,
                            description: event.target.value,
                            riskModelStatus:
                              riskModelRenameDetail.riskModelStatus,
                          })
                        }
                      />
                      <div>
                        <Group mt="sm">
                          <ActionIcon
                            onClick={onCancelRenameMode}
                            variant="outline"
                          >
                            <IconX size={16} stroke={1.5} />
                          </ActionIcon>
                          <ActionIcon
                            onClick={onRenameConfirm}
                            variant="primary"
                          >
                            <IconCheck size={16} stroke={1.5} />
                          </ActionIcon>
                        </Group>
                      </div>
                    </>
                  )}
                  {!renameMode && (
                    <>
                      <Text size="sm" fw={700}>
                        {riskModelDetail.riskModelName}
                      </Text>
                      <Text size="sm">{riskModelDetail.description}</Text>
                    </>
                  )}
                </div>
                <div className="flex items-center">
                  <Menu width={150} position="bottom-end" withArrow shadow="md">
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray" radius="xl">
                        <IconDots size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item onClick={onRenameClick}>Rename</Menu.Item>
                      {riskModelDetail.riskModelStatus === 'DRAFT' && (
                        <Menu.Item color="red" onClick={onDeleteClick}>
                          Delete
                        </Menu.Item>
                      )}
                    </Menu.Dropdown>
                  </Menu>
                </div>
              </div>
            </div>
          </Card>
        </BackgroundImage>

        <Modal
          opened={opened}
          onClose={close}
          centered
          size="lg"
          styles={{
            content: {
              padding: '15px',
            },
            title: {
              fontWeight: 700,
            },
          }}
          title="Are you sure you want to proceed?"
        >
          <div className="pb-4">
            Publishing this customised risk model will make it available for use
            in applicant risk profiles.
          </div>
          <div className="pb-4">
            Please note:
            <List withPadding listStyleType="disc">
              <List.Item>
                Once published, the risk model cannot be edited or deleted.
              </List.Item>
              <List.Item>
                Archiving is only allowed if no profiles are currently using the
                model.
              </List.Item>
            </List>
          </div>

          <Group mt="lg" grow>
            <Button onClick={close} variant="outline" color="myColor">
              Cancel
            </Button>
            <Button onClick={onPublishRiskModel} variant="primary">
              Publish
            </Button>
          </Group>
        </Modal>

        <Modal
          opened={publishedSuccessfulOpened}
          onClose={publishedSuccessfulActions.close}
          withCloseButton={false}
          centered
          size="sm"
          styles={{
            content: {
              padding: '15px',
            },
            title: {
              fontWeight: 700,
            },
          }}
          title="Risk model published successfully ! 🎉"
        >
          <div>
            Your risk model is now live and available for use in applicant
            profiles.
          </div>
          <Group mt="lg" grow>
            <Button
              onClick={onClickRedirectBackToRiskModelList}
              variant="primary"
            >
              Return to Risk Model List
            </Button>
          </Group>
        </Modal>
        <Tabs variant="unstyled" defaultValue="factor" classNames={classes}>
          <Tabs.List grow>
            <Tabs.Tab value="factor">Risk Factor</Tabs.Tab>
            <Tabs.Tab value="classification">
              Straight High Risk Classification
            </Tabs.Tab>
            <Tabs.Tab value="threshold">Risk Classification Threshold</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="factor">
            <RiskFactor
              riskModelId={riskModelId as string}
              riskModelStatus={riskModelDetail.riskModelStatus}
              riskModelPieChartdata={pieChartdata}
              riskModelRiskFactorData={riskFactorData}
              riskModelRiskWeightProgressPercent={riskWeightProgressPercent}
              closeWithRefetch={handleCloseRefetch}
            />
          </Tabs.Panel>
          <Tabs.Panel value="classification">
            <StraightHighRiskClassification
              riskModelId={riskModelId as string}
              riskModelHighRiskFactorData={highRiskFactorData}
              riskModelStatus={riskModelDetail.riskModelStatus}
            />
          </Tabs.Panel>
          <Tabs.Panel value="threshold">
            <RiskClassificationThreshold
              riskModelId={riskModelId as string}
              riskModelLowRiskThresholds={lowRiskThresholds}
              riskModelMediumRiskThresholds={mediumRiskThresholds}
              riskModelHighRiskThresholds={highRiskThresholds}
              riskModelStatus={riskModelDetail.riskModelStatus}
            />
          </Tabs.Panel>
        </Tabs>
      </div>
    </div>
  );
};

export default RiskModelView;
