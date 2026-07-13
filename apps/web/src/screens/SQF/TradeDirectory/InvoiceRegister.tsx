import {
  Button,
  Group,
  Menu,
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
import { IconChevronDown, IconPlus } from '@tabler/icons-react';
import MantineTable from 'components/Table/MantineTable';
import {
  InvoiceStatusEnum,
  InvoiceStatusTransitions,
  LendingProductEnum,
  LendingProductLabel,
} from 'constants/enum';
import { type MRT_ColumnDef } from 'mantine-react-table';
import React, { useMemo } from 'react';
import { IInvoice } from 'service/tradeDirectory';
import {
  useCreateInvoice,
  useDirectoryOrganizations,
  useInvoices,
  useUpdateInvoiceStatus,
} from 'hooks/useTradeDirectory';
import { InvoiceStatusBadge, LendingProductBadge } from './components/Badges';

const CreateInvoiceModal: React.FC<{ opened: boolean; onClose: () => void }> = ({
  opened,
  onClose,
}) => {
  const { data: organizations = [] } = useDirectoryOrganizations();
  const createMutation = useCreateInvoice();

  const form = useForm({
    initialValues: {
      invoiceNumber: '',
      issuerOrganizationId: '',
      debtorOrganizationId: '',
      lendingProduct: '',
      amount: undefined as number | undefined,
      currency: 'MYR',
      issueDate: '',
      dueDate: '',
    },
    validate: {
      invoiceNumber: (v) => (v ? null : 'Required'),
      issuerOrganizationId: (v) => (v ? null : 'Required'),
      debtorOrganizationId: (v, values) =>
        !v ? 'Required' : v === values.issuerOrganizationId ? 'Must differ from issuer' : null,
      amount: (v) => (v && v > 0 ? null : 'Amount required'),
      issueDate: (v) => (v ? null : 'Required'),
      dueDate: (v) => (v ? null : 'Required'),
    },
  });

  const organizationOptions = organizations.map((organization) => ({
    value: String(organization.id),
    label: organization.organizationName,
  }));

  const handleSubmit = form.onSubmit((values) => {
    createMutation.mutate(
      {
        invoiceNumber: values.invoiceNumber,
        issuerOrganizationId: Number(values.issuerOrganizationId),
        debtorOrganizationId: Number(values.debtorOrganizationId),
        lendingProduct: (values.lendingProduct || undefined) as
          | LendingProductEnum
          | undefined,
        amount: values.amount,
        currency: values.currency,
        issueDate: values.issueDate,
        dueDate: values.dueDate,
      },
      {
        onSuccess: () => {
          notifications.show({ message: 'Invoice uploaded', color: 'green' });
          form.reset();
          onClose();
        },
        onError: (error: any) => {
          notifications.show({
            title: 'Could not upload invoice',
            message: error?.response?.data?.message ?? (error as Error).message,
            color: 'red',
          });
        },
      },
    );
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Upload invoice">
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <TextInput label="Invoice number" {...form.getInputProps('invoiceNumber')} />
          <Select
            label="Issuer (supplier side)"
            data={organizationOptions}
            searchable
            {...form.getInputProps('issuerOrganizationId')}
          />
          <Select
            label="Debtor (buyer side)"
            data={organizationOptions}
            searchable
            {...form.getInputProps('debtorOrganizationId')}
          />
          <Select
            label="Lending product"
            data={Object.values(LendingProductEnum).map((product) => ({
              value: product,
              label: LendingProductLabel[product],
            }))}
            clearable
            {...form.getInputProps('lendingProduct')}
          />
          <NumberInput
            label="Amount"
            min={0}
            thousandSeparator=","
            {...form.getInputProps('amount')}
          />
          <TextInput label="Currency" {...form.getInputProps('currency')} />
          <TextInput
            label="Issue date"
            type="date"
            {...form.getInputProps('issueDate')}
          />
          <TextInput label="Due date" type="date" {...form.getInputProps('dueDate')} />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" color="primary" loading={createMutation.isLoading}>
              Upload
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

const InvoiceRegister: React.FC = () => {
  const { data: invoices = [] } = useInvoices();
  const statusMutation = useUpdateInvoiceStatus();
  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);

  const transition = (invoice: IInvoice, status: InvoiceStatusEnum) => {
    statusMutation.mutate(
      { id: invoice.id, status },
      {
        onSuccess: () => {
          notifications.show({
            message: `${invoice.invoiceNumber} → ${status.replace(/_/g, ' ')}`,
            color: 'green',
          });
        },
        onError: (error: any) => {
          notifications.show({
            title: 'Transition rejected',
            message: error?.response?.data?.message ?? (error as Error).message,
            color: 'red',
          });
        },
      },
    );
  };

  const columns = useMemo<MRT_ColumnDef<IInvoice>[]>(
    () => [
      { accessorKey: 'invoiceNumber', header: 'Invoice No.' },
      {
        id: 'issuer',
        header: 'Issuer',
        accessorFn: (row) =>
          row.issuerOrganization?.organizationName ?? row.issuerOrganizationId,
      },
      {
        id: 'debtor',
        header: 'Debtor',
        accessorFn: (row) =>
          row.debtorOrganization?.organizationName ?? row.debtorOrganizationId,
      },
      {
        id: 'amount',
        header: 'Amount',
        accessorFn: (row) =>
          `${Number(row.amount).toLocaleString()} ${row.currency}`,
      },
      { accessorKey: 'dueDate', header: 'Due' },
      {
        id: 'product',
        header: 'Product',
        accessorFn: (row) => row.lendingProduct ?? '',
        Cell: ({ row }) => (
          <LendingProductBadge product={row.original.lendingProduct} />
        ),
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => row.status,
        Cell: ({ row }) => <InvoiceStatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: 'Move to',
        enableColumnFilter: false,
        enableSorting: false,
        Cell: ({ row }) => {
          const allowed = InvoiceStatusTransitions[row.original.status] ?? [];
          if (allowed.length === 0) return <Text size="xs" c="dimmed">terminal</Text>;
          return (
            <Menu shadow="md" position="bottom-end">
              <Menu.Target>
                <Button
                  size="compact-xs"
                  variant="light"
                  rightSection={<IconChevronDown size="0.8rem" />}
                >
                  Transition
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                {allowed.map((next) => (
                  <Menu.Item
                    key={next}
                    onClick={() => transition(row.original, next)}
                  >
                    {next.replace(/_/g, ' ')}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          );
        },
      },
    ],
    [statusMutation],
  );

  return (
    <div className="p-6">
      <Title order={2} mb={4}>
        Invoice Register
      </Title>
      <Text c="dimmed" size="sm" mb="md">
        Invoices across all lending-product flows. Status moves follow the
        invoice lifecycle — illegal transitions are rejected by the server.
      </Text>
      <MantineTable
        columns={columns}
        data={invoices}
        searchPlaceholder="Search invoices"
        pageSize={15}
        action={
          <Button
            color="primary"
            leftSection={<IconPlus size="1rem" />}
            onClick={openModal}
          >
            Upload invoice
          </Button>
        }
      />
      <CreateInvoiceModal opened={modalOpened} onClose={closeModal} />
    </div>
  );
};

export default InvoiceRegister;
