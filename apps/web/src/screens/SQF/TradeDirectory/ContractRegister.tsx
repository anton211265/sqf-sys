import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import MantineTable from 'components/Table/MantineTable';
import {
  ContractStatusEnum,
  ContractTypeEnum,
  LendingProductEnum,
  LendingProductLabel,
} from 'constants/enum';
import { type MRT_ColumnDef } from 'mantine-react-table';
import React, { useMemo } from 'react';
import { IContract } from 'service/tradeDirectory';
import {
  useContracts,
  useCreateContract,
  useDirectoryOrganizations,
  useUpdateContract,
} from 'hooks/useTradeDirectory';
import { ContractStatusBadge, LendingProductBadge } from './components/Badges';

const CreateContractModal: React.FC<{ opened: boolean; onClose: () => void }> = ({
  opened,
  onClose,
}) => {
  const { data: organizations = [] } = useDirectoryOrganizations();
  const createMutation = useCreateContract();

  const form = useForm({
    initialValues: {
      contractType: ContractTypeEnum.FACILITY_AGREEMENT as string,
      firstPartyOrganizationId: '',
      secondPartyOrganizationId: '',
      lendingProduct: '',
      reference: '',
      startDate: '',
      endDate: '',
      contractValue: undefined as number | undefined,
      currency: 'MYR',
      paymentTermsDays: undefined as number | undefined,
    },
    validate: {
      firstPartyOrganizationId: (v) => (v ? null : 'Required'),
      secondPartyOrganizationId: (v, values) =>
        !v
          ? 'Required'
          : v === values.firstPartyOrganizationId
            ? 'Must differ from first party'
            : null,
      lendingProduct: (v, values) =>
        values.contractType === ContractTypeEnum.FACILITY_AGREEMENT && !v
          ? 'Required for facility agreements'
          : null,
    },
  });

  const organizationOptions = organizations.map((organization) => ({
    value: String(organization.id),
    label: organization.organizationName,
  }));

  const isFacility = form.values.contractType === ContractTypeEnum.FACILITY_AGREEMENT;

  const handleSubmit = form.onSubmit((values) => {
    createMutation.mutate(
      {
        contractType: values.contractType as ContractTypeEnum,
        firstPartyOrganizationId: Number(values.firstPartyOrganizationId),
        secondPartyOrganizationId: Number(values.secondPartyOrganizationId),
        lendingProduct: isFacility
          ? (values.lendingProduct as LendingProductEnum)
          : undefined,
        reference: values.reference || undefined,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
        contractValue: values.contractValue,
        currency: values.currency || undefined,
        paymentTermsDays: values.paymentTermsDays,
      },
      {
        onSuccess: () => {
          notifications.show({ message: 'Contract created', color: 'green' });
          form.reset();
          onClose();
        },
        onError: (error: any) => {
          notifications.show({
            title: 'Could not create contract',
            message: error?.response?.data?.message ?? (error as Error).message,
            color: 'red',
          });
        },
      },
    );
  });

  return (
    <Modal opened={opened} onClose={onClose} title="New contract">
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <Select
            label="Contract type"
            data={[
              {
                value: ContractTypeEnum.FACILITY_AGREEMENT,
                label: 'Facility agreement (funder ↔ client)',
              },
              {
                value: ContractTypeEnum.COMMERCIAL,
                label: 'Commercial (org ↔ org)',
              },
            ]}
            {...form.getInputProps('contractType')}
          />
          <Select
            label={isFacility ? 'Funder organisation' : 'First party'}
            data={organizationOptions}
            searchable
            {...form.getInputProps('firstPartyOrganizationId')}
          />
          <Select
            label={isFacility ? 'Client organisation' : 'Second party'}
            data={organizationOptions}
            searchable
            {...form.getInputProps('secondPartyOrganizationId')}
          />
          {isFacility && (
            <Select
              label="Lending product"
              data={Object.values(LendingProductEnum).map((product) => ({
                value: product,
                label: LendingProductLabel[product],
              }))}
              {...form.getInputProps('lendingProduct')}
            />
          )}
          <TextInput label="Reference" {...form.getInputProps('reference')} />
          <Group grow>
            <TextInput
              label="Start date"
              type="date"
              {...form.getInputProps('startDate')}
            />
            <TextInput
              label="End date"
              type="date"
              {...form.getInputProps('endDate')}
            />
          </Group>
          <Group grow>
            <NumberInput
              label="Value"
              min={0}
              thousandSeparator=","
              {...form.getInputProps('contractValue')}
            />
            <TextInput label="Currency" {...form.getInputProps('currency')} />
          </Group>
          <NumberInput
            label="Payment terms (days)"
            min={0}
            {...form.getInputProps('paymentTermsDays')}
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" color="primary" loading={createMutation.isLoading}>
              Create
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

const ContractRegister: React.FC = () => {
  const { data: contracts = [] } = useContracts();
  const updateMutation = useUpdateContract();
  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);

  const setStatus = (contract: IContract, status: ContractStatusEnum) => {
    updateMutation.mutate(
      { id: contract.id, status },
      {
        onSuccess: () => {
          notifications.show({
            message: `${contract.reference ?? contract.id} → ${status}`,
            color: 'green',
          });
        },
        onError: (error: any) => {
          notifications.show({
            title: 'Update failed',
            message: error?.response?.data?.message ?? (error as Error).message,
            color: 'red',
          });
        },
      },
    );
  };

  const columns = useMemo<MRT_ColumnDef<IContract>[]>(
    () => [
      {
        id: 'reference',
        header: 'Reference',
        accessorFn: (row) => row.reference ?? `#${row.id}`,
      },
      {
        id: 'type',
        header: 'Type',
        accessorFn: (row) =>
          row.contractType === ContractTypeEnum.FACILITY_AGREEMENT
            ? 'Facility'
            : 'Commercial',
      },
      {
        id: 'product',
        header: 'Product',
        accessorFn: (row) => row.lendingProduct ?? '',
        Cell: ({ row }) => (
          <LendingProductBadge product={row.original.lendingProduct} />
        ),
      },
      {
        id: 'parties',
        header: 'Parties',
        accessorFn: (row) =>
          `${row.firstPartyOrganization?.organizationName ?? row.firstPartyOrganizationId} ↔ ${row.secondPartyOrganization?.organizationName ?? row.secondPartyOrganizationId}`,
      },
      {
        id: 'value',
        header: 'Value',
        accessorFn: (row) =>
          row.contractValue
            ? `${Number(row.contractValue).toLocaleString()} ${row.currency ?? ''}`
            : '—',
      },
      { accessorKey: 'endDate', header: 'Ends' },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => row.status,
        Cell: ({ row }) => <ContractStatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: 'Set status',
        enableColumnFilter: false,
        enableSorting: false,
        Cell: ({ row }) => (
          <Select
            size="xs"
            w={130}
            placeholder="Set status"
            data={Object.values(ContractStatusEnum).filter(
              (status) => status !== row.original.status,
            )}
            onChange={(value) =>
              value && setStatus(row.original, value as ContractStatusEnum)
            }
            value={null}
          />
        ),
      },
    ],
    [updateMutation],
  );

  return (
    <div className="p-6">
      <Title order={2} mb={4}>
        Contracts
      </Title>
      <Text c="dimmed" size="sm" mb="md">
        Facility agreements between the funder and its clients, and commercial
        contracts between trading counterparties.
      </Text>
      <MantineTable
        columns={columns}
        data={contracts}
        searchPlaceholder="Search contracts"
        pageSize={15}
        action={
          <Button
            color="primary"
            leftSection={<IconPlus size="1rem" />}
            onClick={openModal}
          >
            New contract
          </Button>
        }
      />
      <CreateContractModal opened={modalOpened} onClose={closeModal} />
    </div>
  );
};

export default ContractRegister;
