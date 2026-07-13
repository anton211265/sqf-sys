import {
  ActionIcon,
  Button,
  Flex,
  Group,
  Modal,
  Text,
  Tooltip,
} from '@mantine/core';
import {
  MRT_ColumnDef,
  MRT_Row,
  MRT_TableOptions,
  MantineReactTable,
} from 'mantine-react-table';
import { useDisclosure } from '@mantine/hooks';
import React, { FC, useEffect, useMemo, useState } from 'react';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { color } from 'constants/color';
import axios from 'axios';
import { BASE_URL } from 'constants/constant';

interface StraightHighRiskClassificationProps {
  riskModelId: string;
  riskModelHighRiskFactorData: any[];
  riskModelStatus: string;
}
const StraightHighRiskClassification: FC<
  StraightHighRiskClassificationProps
> = ({ riskModelId, riskModelHighRiskFactorData, riskModelStatus }) => {
  const [deleteOpened, deleteModalAction] = useDisclosure(false); // delete modal

  const [highRiskFactorData, setHighRiskFactorData] = useState<any[]>([]);

  const [riskHighRiskIdSelected, setRiskHighRiskIdSelected] =
    useState<string>('');

  useEffect(() => {
    setHighRiskFactorData(riskModelHighRiskFactorData);
  }, [riskModelHighRiskFactorData]);

  const highRiskColumns: MRT_ColumnDef<any>[] = useMemo(
    () => [
      {
        accessorKey: 'riskFactor',
        header: 'Risk Factor',
        enableHiding: false,
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase',
            fontSize: '13px',
            color: color.DARKGREY,
          },
        },
        size: 200,
        mantineFilterTextInputProps: {
          placeholder: 'Search by Risk Factor', // Custom placeholder
        },
        Cell: ({ cell }) => <span>{cell.getValue<string>()}</span>, // Render the country data in uppercase
      },

      {
        accessorKey: 'description',
        header: 'Description',
        enableHiding: false,
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase',
            fontSize: '13px',
            color: color.DARKGREY,
          },
        },
        size: 200,
        mantineFilterTextInputProps: {
          placeholder: 'Search by Risk Factor', // Custom placeholder
        },
        Cell: ({ cell }) => <span>{cell.getValue<string>()}</span>, // Render the country data in uppercase
      },
    ],
    []
  );

  //CREATE action
  const handleCreateHighRiskFactor: MRT_TableOptions<any>['onCreatingRowSave'] =
    async ({ values, exitCreatingMode }) => {
      // const newValidationErrors = validateUser(values);
      // if (Object.values(newValidationErrors).some((error) => error)) {
      //   setValidationErrors(newValidationErrors);
      //   return;
      // }
      // setValidationErrors({});
      await createHighRiskFactor(values);
      exitCreatingMode();
    };

  const createHighRiskFactor = async (data: any) => {
    try {
      const apiRequestBody = [
        {
          riskFactor: data.riskFactor,
          description: data.description,
        },
      ];

      axios
        .post(
          `${BASE_URL}/risk-operation/api/risk-high-classification-factor/${riskModelId}`,
          apiRequestBody,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        .then((resp) => {
          setHighRiskFactorData((prevData) => [...prevData, resp.data.data[0]]);
        });
    } catch (error) {
      console.log(error);
    }
  };

  //UPDATE action
  const handleSaveHighRiskFactor: MRT_TableOptions<any>['onEditingRowSave'] =
    async ({ row, values, table }) => {
      await updateHighRiskFactor(values, row.original.id);
      table.setEditingRow(null); //exit editing mode
    };

  const updateHighRiskFactor = async (data: any, rowId: string) => {
    try {
      const riskHighClassificationFactorsId = rowId;
      const apiRequestBody = {
        riskFactor: data.riskFactor,
        description: data.description,
      };
      axios
        .patch(
          `${BASE_URL}/risk-operation/api/risk-high-classification-factor/${riskModelId}/${riskHighClassificationFactorsId}`,
          apiRequestBody,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        .then((resp) => {
          setHighRiskFactorData((prevData) =>
            prevData.map((item) =>
              item.id === rowId ? { ...item, ...resp.data.data } : item
            )
          );
        });
    } catch (error) {
      console.log(error);
    }
  };

  //DELETE action
  const openDeleteConfirmModal = (row: MRT_Row<any>) => {
    setRiskHighRiskIdSelected(row.original.id);
    deleteModalAction.open();
  };

  const deleteHighRiskFactor = async () => {
    try {
      axios
        .delete(
          `${BASE_URL}/risk-operation/api/risk-high-classification-factor/${riskModelId}/${riskHighRiskIdSelected}`,

          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        .then((resp) => {
          setRiskHighRiskIdSelected('');
          setHighRiskFactorData((prevData) =>
            prevData.filter((item) => item.id !== riskHighRiskIdSelected)
          );
          deleteModalAction.close();
        });
    } catch (error) {
      console.log(error);
    }
  };
  const addHighRiskNewFactor = ({ table }: any) => {
    return (
      <div className="m-3">
        <Button
          variant="primary"
          className="w-full md:w-auto"
          // onClick={newHighRisk.open}
          onClick={() => {
            table.setCreatingRow(true); //simplest way to open the create row modal with no default values
            //or you can pass in a row object to set default values with the `createRow` helper function
            // table.setCreatingRow(
            //   createRow(table, {
            //     //optionally pass in default values for the new row, useful for nested data or other complex scenarios
            //   }),
            // );
          }}
        >
          Add New Risk Factor
        </Button>
      </div>
    );
  };

  const renderActionButton = ({ row, table }: any) => {
    return (
      <Flex gap="md">
        <Tooltip label="Edit">
          <ActionIcon
            variant="filled"
            aria-label="Edit"
            radius="xl"
            onClick={() => table.setEditingRow(row)}
          >
            <IconPencil size={16} stroke={1.5} />
          </ActionIcon>
        </Tooltip>

        <Tooltip label="Delete">
          <ActionIcon
            variant="filled"
            aria-label="Delete"
            radius="xl"
            onClick={() => openDeleteConfirmModal(row)}
            color="rgba(250,82,82,1)"
          >
            <IconTrash size={16} stroke={1.5} />
          </ActionIcon>
        </Tooltip>
      </Flex>
    );
  };

  return (
    <div>
      <div className="my-5">
        <Text size="sm" fw={700}>
          Straight High Risk Classification Overrides
        </Text>
        <Text size="sm">
          Define the risk factor that triggers automatic high-risk
          classification
        </Text>
      </div>

      <MantineReactTable
        data={highRiskFactorData}
        columns={highRiskColumns}
        enableEditing={riskModelStatus !== 'ARCHIVED' ? true : false}
        positionActionsColumn="last"
        createDisplayMode="row" // ('modal', and 'custom' are also available)
        editDisplayMode="row" // ('modal', 'cell', 'table', and 'custom' are also available)
        renderTopToolbarCustomActions={
          riskModelStatus !== 'ARCHIVED' ? addHighRiskNewFactor : undefined
        }
        onCreatingRowSave={handleCreateHighRiskFactor}
        onEditingRowSave={handleSaveHighRiskFactor}
        renderRowActions={renderActionButton}
      />

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
          <Button
            onClick={deleteModalAction.close}
            variant="outline"
            color="myColor"
          >
            Cancel
          </Button>
          <Button onClick={deleteHighRiskFactor} color="red">
            Delete
          </Button>
        </Group>
      </Modal>
    </div>
  );
};

export default StraightHighRiskClassification;
