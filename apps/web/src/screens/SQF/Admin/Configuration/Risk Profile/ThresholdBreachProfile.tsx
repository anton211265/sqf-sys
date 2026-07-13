import {
  Button,
  Grid,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
} from '@mantine/core';
import React, { FC, useEffect, useState } from 'react';
import QuantitativeParameterTab from './ThresholdBreachTabs/QuantitativeParameterTab';
import { IconChevronLeft, IconPencil } from '@tabler/icons-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ADMIN } from 'constants/routes';
import { useDisclosure } from '@mantine/hooks';
import axios from 'axios';
import { BASE_URL } from 'constants/constant';
import { businessSectors } from 'constants/businessSector';
import { organizationCapitalSize } from 'constants/organizationCapitalSize';
import { currencyList } from 'constants/countries';
import { notifications } from '@mantine/notifications';

export interface ThresholdBreachProfileProps {
  mode: 'create' | 'edit' | 'view';
  riskProfileCode?: string;
  riskParameterName?: string;
}

interface RiskProfile {
  businessSector: string;
  businessSectorOther: string | null;
  capitalSize: string;
  capitalCurrency: string;
}

const ThresholdBreachProfile: FC<ThresholdBreachProfileProps> = ({ mode }) => {
  const [searchParams, setSearchParams] = useSearchParams(); // Extract the ID from the URL
  const { riskProfileCode } = useParams();
  const [opened, { open, close }] = useDisclosure(false); // change risk profile modal
  const [riskProfiles, setRiskProfiles] = useState([]);

  const [currRiskProfile, setCurrRiskProfile] = useState<RiskProfile>();
  const [riskQuantitativeParameters, setRiskQuantitativeParameters] = useState<
    any[]
  >([]);

  const [editable, setEditable] = useState<boolean>(false);
  const [displayRiskProfileCode, setDisplayRiskProfileCode] =
    useState<string>('');
  const [selectedNewRiskProfile, setSelectedNewRiskProfile] =
    useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    setDisplayRiskProfileCode(searchParams.get('riskProfileCode') as string);
    fetchRiskProfileData();
    fetchAllRiskProfile();
  }, [mode]);

  const fetchRiskProfileData = () => {
    axios
      .get(
        `${BASE_URL}/risk-operation/api/risk-profile/${searchParams.get(
          'riskProfileCode'
        )}`
      )
      .then((resp) => {
        const responseData = resp.data.data;
        const sortedParameter = responseData.riskQuantitativeParameters.sort(
          (a: any, b: any) => a.parameterId - b.parameterId
        );
        setCurrRiskProfile(responseData);
        setRiskQuantitativeParameters(sortedParameter);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const fetchAllRiskProfile = () => {
    axios
      .get(`${BASE_URL}/risk-operation/api/risk-profile`)
      .then((resp) => {
        const responseData = resp.data.data;
        const filteredData = responseData.filter(
          (item: any) =>
            item.riskProfileCode !== searchParams.get('riskProfileCode')
        );
        setRiskProfiles(filteredData);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const onClickRedirectBackToRiskFilterTab = () => {
    navigate({
      pathname: ADMIN.ORGANIZATIONVIEW.replace(
        ':organizationId',
        searchParams.get('organization') as string
      ),
      search: `?tab=risk&application=${searchParams.get('application')}`,
    });
  };

  const onClickRedirectBackToRiskProfile = () => {
    navigate({
      pathname: ADMIN.THRESHOLDRISKPROFILES,
    });
  };

  const onChangeRiskProfile = () => {
    console.log('Risk profile changed', selectedNewRiskProfile);

    const apiRequestBody = {
      riskProfileCode: selectedNewRiskProfile,
    };

    axios
      .patch(
        `${BASE_URL}/risk-operation/api/risk-application-scoring/${searchParams.get(
          'application'
        )}/change-risk-profile`,
        apiRequestBody
      )
      .then((resp) => {
        searchParams.set('riskProfileCode', selectedNewRiskProfile);
        setSearchParams(searchParams);
        fetchRiskProfileData();

        close();

        notifications.show({
          title: 'Success',
          message: 'Risk Profile had been updated successfully.',
          color: 'green',
        });
      })
      .catch((error) => {
        console.log(error);
        notifications.show({
          id: 'fetch-error', // Unique ID to ensure it displays only once
          title: 'Error',
          message: 'Failed to change risk profile',
          color: 'red',
          autoClose: 2000,
        });
      });
  };

  const onEditClick = () => {
    setEditable(!editable);
  };

  const onSaveRiskProfileClick = async () => {
    const apiRequestBody = {
      businessSector: currRiskProfile?.businessSector,
      businessSectorOther:
        currRiskProfile?.businessSectorOther !== ''
          ? currRiskProfile?.businessSectorOther
          : null,
      capitalSize: currRiskProfile?.capitalSize,
      capitalCurrency: currRiskProfile?.capitalCurrency,
    };

    axios
      .patch(
        `${BASE_URL}/risk-operation/api/risk-profile/${searchParams.get(
          'riskProfileCode'
        )}`,
        apiRequestBody
      )
      .then((resp) => {
        const responseData = resp.data.data;
        searchParams.set(
          'riskProfileCode',
          responseData.riskProfileCode as string
        );
        setSearchParams(searchParams);

        setEditable(!editable);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <div className="min-h-screen flex flex-col pb-14 px-[5%]">
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
        title="Change Risk Profile"
      >
        <div className="pb-4">
          Please select a risk profile to configure the threshold breach
          triggers.
          <Select
            label="Risk Profile"
            data={riskProfiles.map((profile: any) => ({
              label: profile.riskProfileCode,
              value: profile.riskProfileCode,
            }))}
            searchable
            clearable
            value={selectedNewRiskProfile}
            onChange={(value) => setSelectedNewRiskProfile(value as string)}
          ></Select>
        </div>

        <Group mt="lg" grow>
          <Button onClick={close} variant="outline" color="myColor">
            Cancel
          </Button>
          <Button onClick={onChangeRiskProfile} variant="primary">
            Save
          </Button>
        </Group>
      </Modal>

      <div>
        {mode === 'view' && (
          <Button
            variant="transparent"
            className="w-full md:w-auto text-xs -mx-4"
            style={{
              color: '#000000',
            }}
            leftSection={<IconChevronLeft size={18} />}
            onClick={onClickRedirectBackToRiskFilterTab}
          >
            Back to Risk Filter Tab
          </Button>
        )}

        {mode === 'edit' && (
          <Button
            variant="transparent"
            className="w-full md:w-auto text-xs -mx-4"
            style={{
              color: '#000000',
            }}
            leftSection={<IconChevronLeft size={18} />}
            onClick={onClickRedirectBackToRiskProfile}
          >
            Back to Risk Profile
          </Button>
        )}
      </div>

      <Text my={'lg'} size="lg" fw={700}>
        Threshold Breach Triggers
      </Text>
      <Text mb="md">
        Please select the business sector and capital size to to configure
        settings.
      </Text>
      <Stack gap="md">
        {mode === 'view' && (
          <Grid>
            <Grid.Col span={2}>
              <Text size="sm">Risk Profile Code</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 10, md: 6 }}>
              <TextInput
                value={searchParams.get('riskProfileCode') as string}
                disabled={mode == 'view'}
              />
            </Grid.Col>
          </Grid>
        )}

        <Grid>
          <Grid.Col span={2}>
            <Text size="sm">Business Sector</Text>
          </Grid.Col>
          <Grid.Col span={{ base: 10, md: 6 }}>
            <Select
              data={businessSectors.map((business) => ({
                label: business.name,
                value: business.code,
              }))}
              searchable
              clearable
              value={currRiskProfile?.businessSector}
              onChange={(value) => {
                if (currRiskProfile) {
                  setCurrRiskProfile({
                    ...currRiskProfile,
                    businessSector: value as string,
                  });
                }
              }}
              disabled={editable == false}
            />
          </Grid.Col>
        </Grid>

        {currRiskProfile?.businessSector == 'OTHERS' && (
          <Grid>
            <Grid.Col span={2}>
              <Text size="sm">Business Sector (Other)</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 10, md: 6 }}>
              <TextInput
                disabled={editable == false}
                value={currRiskProfile?.businessSectorOther as string}
                onChange={(event) =>
                  setCurrRiskProfile((prev) => {
                    if (!prev) return prev; // or provide a default object if needed

                    return {
                      ...prev,
                      businessSectorOther: event.target.value,
                    };
                  })
                }
              />
            </Grid.Col>
          </Grid>
        )}

        <Grid>
          <Grid.Col span={2}>
            <Text size="sm">Capital Size</Text>
          </Grid.Col>
          <Grid.Col span={{ base: 10, md: 6 }}>
            <Select
              value={currRiskProfile?.capitalSize}
              data={organizationCapitalSize.map((size) => ({
                label: size.name,
                value: size.name,
              }))}
              searchable
              clearable
              disabled={editable == false}
              onChange={(value) => {
                if (currRiskProfile) {
                  setCurrRiskProfile({
                    ...currRiskProfile,
                    capitalSize: value as string,
                  });
                }
              }}
            />
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={2}>
            <Text size="sm">Currency</Text>
          </Grid.Col>
          <Grid.Col span={{ base: 10, md: 6 }}>
            <Select
              value={currRiskProfile?.capitalCurrency}
              data={currencyList.map((currency) => ({
                label: currency.label,
                value: currency.value,
              }))}
              searchable
              clearable
              disabled={editable == false}
              onChange={(value) => {
                if (currRiskProfile) {
                  setCurrRiskProfile({
                    ...currRiskProfile,
                    capitalCurrency: value as string,
                  });
                }
              }}
            />
          </Grid.Col>
        </Grid>

        <div>
          {mode === 'view' && (
            <Button
              leftSection={<IconPencil size={16} />}
              variant="primary"
              onClick={open}
            >
              Change Risk Profile
            </Button>
          )}

          {mode === 'edit' && (
            <>
              {editable == false && (
                <Button
                  leftSection={<IconPencil size={16} />}
                  variant="primary"
                  onClick={onEditClick}
                >
                  Edit
                </Button>
              )}

              {editable && (
                <Group>
                  <Button
                    variant="outline"
                    color="myColor"
                    onClick={onEditClick}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    onClick={onSaveRiskProfileClick}
                  >
                    Save
                  </Button>
                </Group>
              )}
            </>
          )}
        </div>
      </Stack>

      <Text my={'lg'} size="lg" fw={700}>
        Risk Quantitative Parameters
      </Text>
      {riskQuantitativeParameters.length !== 0 && (
        <Tabs
          defaultValue={riskQuantitativeParameters[0].parameterName}
          variant="outline"
        >
          <Tabs.List>
            {riskQuantitativeParameters.map((item) => (
              <Tabs.Tab
                key={item.parameterId}
                value={item.parameterName}
                style={{ fontSize: '13px' }}
              >
                {item.parameterName}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          {riskQuantitativeParameters.map((item) => (
            <Tabs.Panel key={item.parameterId} value={item.parameterName}>
              <div className="mt-5">
                <QuantitativeParameterTab
                  riskProfileCode={searchParams.get('riskProfileCode') as string}
                  riskParameterName={item.parameterName}
                  mode={mode}
                />
              </div>
            </Tabs.Panel>
          ))}
        </Tabs>
      )}
    </div>
  );
};

export default ThresholdBreachProfile;
