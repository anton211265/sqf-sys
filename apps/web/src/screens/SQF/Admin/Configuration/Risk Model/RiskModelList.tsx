import {
  Button,
  Group,
  Modal,
  Textarea,
  TextInput,
  Text,
  ActionIcon,
  FocusTrap,
  Badge,
  Flex,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconArchive, IconEye, IconTrash } from '@tabler/icons-react';
import axios from 'axios';
import { color } from 'constants/color';
import { BASE_URL } from 'constants/constant';
import { ADMIN } from 'constants/routes';
import { MantineReactTable, MRT_ColumnDef } from 'mantine-react-table';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createNewRiskModelValidator } from './Forms/FormValidation';
import {
  createNewARiskModelInitialValues,
  createNewRiskModel,
} from './Forms/InitialValues';

const RiskModelList = () => {
  const [opened, { open, close }] = useDisclosure(false); // new risk model modal
  const [deleteOpened, deleteModalAction] = useDisclosure(false); // delete modal
  const [archiveOpened, archiveModalAction] = useDisclosure(false); // archived modal
  const [riskModelIdSelected, setRiskModelIdSelected] = useState<string>('');
  const [riskModelData, setRiskModelData] = useState<any[]>([]);

  const form = useForm<createNewRiskModel>({
    initialValues: createNewARiskModelInitialValues,
    // validateInputOnChange: true,
    validate: zodResolver(createNewRiskModelValidator),
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchRiskModelData();
  }, []);

  const fetchRiskModelData = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/risk-operation/api/risk-model`
      );
      const fetchedRiskModelsData = response.data.data;
      setRiskModelData(fetchedRiskModelsData); // Update state with fetched org data
    } catch (error) {
      console.error('Error fetching organizations:', error);
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

  const onCreateRiskModel = async (values: createNewRiskModel) => {
    const apiRequestBody = {
      riskModelName: values.riskModelName,
      description: values.description,
    };

    axios
      .post(
        `${BASE_URL}/risk-operation/api/risk-model`,
        JSON.stringify(apiRequestBody),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      .then((resp) => {
        onViewRiskModel(resp.data.data.riskModelNumber);
      });
  };

  const onViewRiskModel = (riskId: string) => {
    navigate(ADMIN.RISKMODELVIEW.replace(':riskModelId', riskId));
  };

  const onOpenModal = (action: string, riskId: string) => {
    setRiskModelIdSelected(riskId);
    switch (action) {
      case 'delete':
        deleteModalAction.open();
        break;
      case 'archive':
        archiveModalAction.open();
        break;
      default:
        break;
    }
  };

  const onDeleteRiskModel = () => {
    try {
      axios
        .delete(
          `${BASE_URL}/risk-operation/api/risk-model/${riskModelIdSelected}`
        )
        .then((resp) => {
          setRiskModelIdSelected('');
          deleteModalAction.close();
          fetchRiskModelData();
        });
    } catch (error) {
      console.error(
        `Error fetching riskModelId data for ID: ${riskModelIdSelected}:`,
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

  const onArchivedRiskModel = () => {
    try {
      axios
        .patch(
          `${BASE_URL}/risk-operation/api/risk-model/${riskModelIdSelected}/update-status`,
          {
            status: 'ARCHIVED',
          }
        )
        .then((resp) => {
          archiveModalAction.close();
          fetchRiskModelData();
        });
    } catch (error) {
      console.error(
        `Error fetching riskModelId data for ID: ${riskModelIdSelected}:`,
        error
      );

      // Show error notification (with "once" to prevent duplication)
      notifications.show({
        id: 'fetch-error', // Unique ID to ensure it displays only once
        title: 'Error',
        message: 'Failed to archive risk model',
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

  const columns: MRT_ColumnDef<any>[] = useMemo(
    () => [
      {
        accessorKey: 'riskModelName',
        header: 'Risk Model Name',
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase', // Converts header text to lowercase
            fontSize: '13px',
            color: color.DARKGREY,
          },
        },
        mantineFilterTextInputProps: {
          placeholder: 'Search by Risk Factor', // Custom placeholder
        },
        enableHiding: false,
        Cell: ({ cell }) => (
          <span className="capitalize">
            {cell.getValue<string>().toLowerCase()}
          </span>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
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
          placeholder: 'Search by Description', // Custom placeholder
        },
      },
      {
        accessorKey: 'riskModelStatus',
        header: 'Status',
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase', // Converts header text to lowercase
            fontSize: '13px',
            color: color.DARKGREY,
          },
        },

        filterVariant: 'select', // Use a dropdown for filtering
        mantineFilterSelectProps: {
          data: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], // Options for the dropdown
          placeholder: 'Search by Status', // Custom placeholder
        },
        enableHiding: false,
        enableSorting: false,
        Cell: ({ row }) => {
          return (
            <Badge
              color={statusColors[row.original.riskModelStatus]} // Fallback color for unknown personas
              variant="light"
              size="md"
              radius="md"
            >
              {row.original.riskModelStatus}
            </Badge>
          );
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
          if (row.original.riskModelStatus === 'PUBLISHED') {
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
              onClick={() => onViewRiskModel(row.original.riskModelNumber)}
            >
              <IconEye size={16} stroke={1.5} />
            </ActionIcon>
            {row.original.riskModelStatus === 'DRAFT' && (
              <ActionIcon
                variant="filled"
                aria-label="Delete"
                radius="xl"
                onClick={() =>
                  onOpenModal('delete', row.original.riskModelNumber)
                }
                color="rgba(250,82,82,1)"
              >
                <IconTrash size={16} stroke={1.5} />
              </ActionIcon>
            )}

            {row.original.riskModelStatus === 'PUBLISHED' && (
              <ActionIcon
                variant="outline"
                aria-label="Archived"
                radius="xl"
                onClick={() =>
                  onOpenModal('archive', row.original.riskModelNumber)
                }
                disabled={row.original.numberOfActiveProfiles > 0}
              >
                <IconArchive size={16} stroke={1.5} />
              </ActionIcon>
            )}
          </Flex>
        ),
      },
    ],
    []
  );

  return (
    <div className="min-h-screen flex flex-col pb-14 px-[5%] ">
      <div className="pt-14 pb-9 flex justify-between items-center">
        <div>
          <Text size="xl" fw={700}>
            Risk Model List
          </Text>
          <Text size="sm">
            A collection of models used to evaluate and assess different types
            of risk factors for decision-making.
          </Text>
        </div>

        <Button variant="primary" className="w-full md:w-auto" onClick={open}>
          Add New Risk Model
        </Button>
      </div>

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
        title="Create New Risk Model"
      >
        <form
          onSubmit={form.onSubmit((values) => {
            onCreateRiskModel(values);
          })}
        >
          <TextInput
            data-autofocus
            label="Risk Model Name"
            placeholder="e.g., Agriculture Risk Model"
            key={form.key('riskModelName')}
            {...form.getInputProps('riskModelName')}
          />
          <Textarea
            label="Description"
            placeholder="e.g., Evaluates risks related to climate conditions, market volatility, and regulatory compliance."
            mt="md"
            key={form.key('description')}
            {...form.getInputProps('description')}
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

      {/* Delete Modal */}
      <Modal
        opened={deleteOpened}
        onClose={deleteModalAction.close}
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
          This action cannot be undone and will permanently remove all
          associated data.
        </div>
        <div className="pb-4">
          If you're certain, please confirm your decision.
        </div>
        <Group mt="lg" grow>
          <Button onClick={close} variant="outline" color="myColor">
            Cancel
          </Button>
          <Button onClick={onDeleteRiskModel} color="red">
            Delete
          </Button>
        </Group>
      </Modal>

      {/* Archived Modal */}
      <Modal
        opened={archiveOpened}
        onClose={archiveModalAction.close}
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
        title="Confirm Archive"
      >
        <div className="pb-4">
          Archiving will disable its use and visibility but will preserve its
          data for future reference.
        </div>
        <div className="pb-4">
          If you're certain, please confirm your decision.
        </div>
        <Group mt="lg" grow>
          <Button onClick={close} variant="outline" color="myColor">
            Cancel
          </Button>
          <Button onClick={onArchivedRiskModel} variant="primary">
            Archive
          </Button>
        </Group>
      </Modal>

      {/* Table section */}
      <MantineReactTable data={riskModelData} columns={columns} />
    </div>
  );
};

export default RiskModelList;
