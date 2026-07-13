import {
  ActionIcon,
  Badge,
  Button,
  Flex,
  Group,
  Modal,
  Select,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { IconEye } from '@tabler/icons-react';
import { color } from 'constants/color';
import { MantineReactTable, MRT_ColumnDef } from 'mantine-react-table';
import React, { useEffect, useMemo, useState } from 'react';
import {
  createNewThresholdProfile,
  createNewThresholdProfileInitialValues,
} from '../Risk Model/Forms/InitialValues';
import { currencyList } from 'constants/countries';
import { businessSectors } from 'constants/businessSector';
import { useNavigate } from 'react-router-dom';
import { ADMIN } from 'constants/routes';
import axios from 'axios';
import { BASE_URL } from 'constants/constant';
import { notifications } from '@mantine/notifications';
import { organizationCapitalSize } from 'constants/organizationCapitalSize';

const ThresholdBreachProfileList = () => {
  const [opened, { open, close }] = useDisclosure(false); // new risk threshold profile modal
  const [risProfilesData, setRiskProfilesData] = useState<any[]>([
    {
      code: 'Default',
      businessSector: 'Default',
      capitalSize: null,
      capitalCurrency: null,
      numberOfActiveProfiles: 0,
    },
  ]);

  const columns: MRT_ColumnDef<any>[] = useMemo(
    () => [
      {
        accessorKey: 'riskProfileCode',
        header: 'Code',
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase', // Converts header text to lowercase
            fontSize: '13px',
            color: color.DARKGREY,
          },
        },
        mantineFilterTextInputProps: {
          placeholder: 'Search by Code', // Custom placeholder
        },
        enableHiding: false,
        Cell: ({ cell }) => (
          <Badge variant="light" color="blue" size="md" radius="md">
            {cell.getValue<string>()}
          </Badge>
        ),
      },
      {
        accessorKey: 'businessSector',
        header: 'Business Sector',
        enableHiding: false,
        size: 300,
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase', // Converts header text to lowercase
            fontSize: '13px',
            color: color.DARKGREY,
          },
        },
        mantineFilterTextInputProps: {
          placeholder: 'Search by Business Sector', // Custom placeholder
        },
        Cell: ({ row }) => {
          if (row.original.businessSector) {
            return <span>{row.original.businessSector}</span>;
          }
          return <span>-</span>;
        },
      },
      {
        accessorKey: 'capitalSize',
        header: 'Capital Size',
        enableHiding: false,
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase', // Converts header text to lowercase
            fontSize: '13px',
            color: color.DARKGREY,
          },
        },
        mantineFilterTextInputProps: {
          placeholder: 'Search by Capital Size', // Custom placeholder
        },
        Cell: ({ row }) => {
          if (row.original.capitalSize) {
            return <span>{row.original.capitalSize}</span>;
          }
          return <span>-</span>;
        },
      },
      {
        accessorKey: 'capitalCurrency',
        header: 'Currency',
        enableHiding: false,
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase', // Converts header text to lowercase
            fontSize: '13px',
            color: color.DARKGREY,
          },
        },
        mantineFilterTextInputProps: {
          placeholder: 'Search by Currency', // Custom placeholder
        },
        Cell: ({ row }) => {
          if (row.original.capitalCurrency) {
            return <span>{row.original.capitalCurrency}</span>;
          }
          return <span>-</span>;
        },
      },
      {
        accessorKey: 'numberOfActiveProfiles',
        header: 'Active Profiles',
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase', // Converts header text to lowercase
            fontSize: '13px',
            color: color.DARKGREY,
          },
        },
        Cell: ({ row }) => {
          if (
            row.original.numberOfActiveProfiles !== undefined &&
            row.original.numberOfActiveProfiles !== null
          ) {
            return <span>{row.original.numberOfActiveProfiles}</span>;
          }
          return <span>-</span>;
        },
      },
      {
        accessorKey: 'action',
        header: 'Actions',
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase', // Converts header text to lowercase
            fontSize: '13px',
            color: color.DARKGREY,
          },
        },
        size: 150,
        enableColumnActions: false,
        enableColumnFilter: false,
        enableSorting: false,
        enableHiding: false,
        Cell: ({ row }) => (
          <Flex gap="sm">
            <ActionIcon
              variant="filled"
              aria-label="View"
              radius="xl"
              onClick={() => onViewRiskProfile(row.original.riskProfileCode)}
            >
              <IconEye size={16} stroke={1.5} />
            </ActionIcon>
          </Flex>
        ),
      },
    ],
    []
  );

  const navigate = useNavigate();

  const form = useForm<createNewThresholdProfile>({
    initialValues: createNewThresholdProfileInitialValues,
    // validateInputOnChange: true,
    // validate: zodResolver(createNewRiskModelValidator),
  });

  useEffect(() => {
    fetchRiskProfilesData();
  }, []);

  const fetchRiskProfilesData = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/risk-operation/api/risk-profile`
      );
      const fetchedRiskProfilesData = response.data.data;
      setRiskProfilesData(fetchedRiskProfilesData); // Update state with fetched org data
    } catch (error) {
      console.error('Error fetching risk profiles:', error);
      // Show error notification (with "once" to prevent duplication)
      notifications.show({
        id: 'fetch-error', // Unique ID to ensure it displays only once
        title: 'Error',
        message: 'Failed to fetched risk profiles',
        color: 'red',
        autoClose: 2000,
      });
    }
  };

  const onCreateRiskProfile = async (values: createNewThresholdProfile) => {
    const apiRequestBody = {
      businessSector: values.businessSector,
      businessSectorOther: values.businessSectorOther
        ? values.businessSectorOther
        : null,
      capitalSize: values.capitalSize,
      capitalCurrency: values.currency,
    };

    axios
      .post(`${BASE_URL}/risk-operation/api/risk-profile`, apiRequestBody)
      .then((resp) => {
        navigate({
          pathname: ADMIN.ADD_THRESHOLDRISKPROFILES,
          search: `?riskProfileCode=${resp.data.data.riskProfileCode}`,
        });
      })
      .catch((error) => {
        const message =
          error?.response?.data?.message ?? 'Failed to create risk profile.';
        notifications.show({
          id: 'create-risk-profile-error',
          title: 'Error',
          message: Array.isArray(message) ? message.join(' · ') : message,
          color: 'red',
          autoClose: 4000,
        });
      });
  };

  const onViewRiskProfile = (riskProfileCode: string) => {
    navigate({
      pathname: ADMIN.ADD_THRESHOLDRISKPROFILES,
      search: `?riskProfileCode=${riskProfileCode}`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col pb-14 px-[5%]">
      <div className="pt-14 pb-9 flex justify-between items-center">
        <div>
          <Text size="xl" fw={700}>
            Threshold Breach Risk Profiles List
          </Text>
          <Text size="sm">
            A list of profiles used to trigger alerts based on risk thresholds.
          </Text>
        </div>

        <Button variant="primary" className="w-full md:w-auto" onClick={open}>
          Add New Risk Profile
        </Button>
      </div>

      {/* Table section */}
      <MantineReactTable data={risProfilesData} columns={columns} />

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
        title="Set Up A New Risk Profile"
      >
        <Text>
          Enter the business sector and capital size to configure threshold
          triggers.
        </Text>
        <form
          onSubmit={form.onSubmit((values) => {
            onCreateRiskProfile(values);
          })}
        >
          <Select
            label="Business Sector"
            placeholder="e.g. Agriculture"
            mb="md"
            data={businessSectors.map((business) => ({
              label: business.name,
              value: business.code,
            }))}
            searchable
            clearable
            comboboxProps={{ withinPortal: false }}
            key={form.key('businessSector')}
            {...form.getInputProps('businessSector')}
          />
          {form.getValues().businessSector == 'OTHERS' && (
            <TextInput
              label=" Please specify your Business Sector"
              placeholder="e.g. Agriculture"
              mb="md"
              key={form.key('businessSectorOther')}
              {...form.getInputProps('businessSectorOther')}
            />
          )}

          <Select
            label="Capital Size"
            placeholder="e.g. 100000"
            mb="md"
            data={organizationCapitalSize.map((size) => ({
              label: size.name,
              value: size.name,
            }))}
            searchable
            clearable
            comboboxProps={{ withinPortal: false }}
            key={form.key('capitalSize')}
            {...form.getInputProps('capitalSize')}
          />
          <Select
            label="Currency"
            placeholder="e.g. SGD"
            mb="md"
            data={currencyList.map((currency) => ({
              label: currency.label,
              value: currency.value,
            }))}
            searchable
            clearable
            comboboxProps={{ withinPortal: false }}
            key={form.key('currency')}
            {...form.getInputProps('currency')}
          />

          <Group mt="lg" grow>
            <Button onClick={close} variant="outline" color="myColor">
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create
            </Button>
          </Group>
        </form>
      </Modal>
    </div>
  );
};

export default ThresholdBreachProfileList;
