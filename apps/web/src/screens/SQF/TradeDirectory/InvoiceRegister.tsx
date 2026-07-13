import {
  ActionIcon,
  Button,
  Divider,
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
import { IconChevronDown, IconPlus, IconTrash } from '@tabler/icons-react';
import MantineTable from 'components/Table/MantineTable';
import {
  InvoiceStatusEnum,
  InvoiceStatusTransitions,
  InvoiceTypeCodeEnum,
  InvoiceTypeCodeLabel,
  LendingProductEnum,
  LendingProductLabel,
  TaxCategoryEnum,
  TaxCategoryLabel,
} from 'constants/enum';
import { type MRT_ColumnDef } from 'mantine-react-table';
import React, { useMemo } from 'react';
import { IInvoice, IInvoiceLine } from 'service/tradeDirectory';
import {
  useCreateInvoice,
  useDirectoryOrganizations,
  useInvoices,
  useUpdateInvoiceStatus,
} from 'hooks/useTradeDirectory';
import { InvoiceStatusBadge, LendingProductBadge } from './components/Badges';

const emptyLine: IInvoiceLine = {
  itemName: '',
  invoicedQuantity: 1,
  invoicedQuantityUnitCode: 'EA',
  priceAmount: 0,
  taxCategoryId: TaxCategoryEnum.STANDARD,
  taxPercent: 0,
  taxSchemeId: 'VAT',
};

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
      invoiceTypeCode: InvoiceTypeCodeEnum.COMMERCIAL_INVOICE as string,
      lendingProduct: '',
      documentCurrencyCode: 'MYR',
      issueDate: '',
      dueDate: '',
      lines: [{ ...emptyLine }] as IInvoiceLine[],
    },
    validate: {
      invoiceNumber: (v) => (v ? null : 'Required'),
      issuerOrganizationId: (v) => (v ? null : 'Required'),
      debtorOrganizationId: (v, values) =>
        !v
          ? 'Required'
          : v === values.issuerOrganizationId
            ? 'Must differ from issuer'
            : null,
      issueDate: (v) => (v ? null : 'Required'),
      dueDate: (v) => (v ? null : 'Required'),
      lines: {
        itemName: (v: string) => (v ? null : 'Required'),
        invoicedQuantity: (v: number) => (v > 0 ? null : 'Must be > 0'),
        priceAmount: (v: number) => (v >= 0 ? null : 'Must be >= 0'),
      },
    },
  });

  const organizationOptions = organizations.map((organization) => ({
    value: String(organization.id),
    label: organization.organizationName,
  }));

  const lineTotal = (line: IInvoiceLine) =>
    (line.invoicedQuantity || 0) * (line.priceAmount || 0);
  const totalExclTax = form.values.lines.reduce(
    (sum, line) => sum + lineTotal(line),
    0,
  );
  const totalTax = form.values.lines.reduce(
    (sum, line) => sum + lineTotal(line) * ((line.taxPercent || 0) / 100),
    0,
  );

  const handleSubmit = form.onSubmit((values) => {
    createMutation.mutate(
      {
        invoiceNumber: values.invoiceNumber,
        issuerOrganizationId: Number(values.issuerOrganizationId),
        debtorOrganizationId: Number(values.debtorOrganizationId),
        invoiceTypeCode: values.invoiceTypeCode as InvoiceTypeCodeEnum,
        lendingProduct: (values.lendingProduct || undefined) as
          | LendingProductEnum
          | undefined,
        documentCurrencyCode: values.documentCurrencyCode,
        issueDate: values.issueDate,
        dueDate: values.dueDate,
        lines: values.lines,
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
    <Modal opened={opened} onClose={onClose} title="Upload invoice" size="lg">
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <Group grow>
            <TextInput label="Invoice number" {...form.getInputProps('invoiceNumber')} />
            <Select
              label="Invoice type"
              data={Object.values(InvoiceTypeCodeEnum).map((code) => ({
                value: code,
                label: InvoiceTypeCodeLabel[code],
              }))}
              {...form.getInputProps('invoiceTypeCode')}
            />
          </Group>
          <Group grow>
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
          </Group>
          <Group grow>
            <Select
              label="Lending product"
              data={Object.values(LendingProductEnum).map((product) => ({
                value: product,
                label: LendingProductLabel[product],
              }))}
              clearable
              {...form.getInputProps('lendingProduct')}
            />
            <TextInput
              label="Currency"
              {...form.getInputProps('documentCurrencyCode')}
            />
          </Group>
          <Group grow>
            <TextInput
              label="Issue date"
              type="date"
              {...form.getInputProps('issueDate')}
            />
            <TextInput label="Due date" type="date" {...form.getInputProps('dueDate')} />
          </Group>

          <Divider label="Line items" labelPosition="left" mt="xs" />

          {form.values.lines.map((_, index) => (
            <Group key={index} align="flex-end" wrap="nowrap">
              <TextInput
                label={index === 0 ? 'Item' : undefined}
                placeholder="Item name"
                style={{ flex: 2 }}
                {...form.getInputProps(`lines.${index}.itemName`)}
              />
              <NumberInput
                label={index === 0 ? 'Qty' : undefined}
                min={0.0001}
                style={{ flex: 1 }}
                {...form.getInputProps(`lines.${index}.invoicedQuantity`)}
              />
              <TextInput
                label={index === 0 ? 'Unit' : undefined}
                style={{ flex: 1 }}
                {...form.getInputProps(`lines.${index}.invoicedQuantityUnitCode`)}
              />
              <NumberInput
                label={index === 0 ? 'Unit price' : undefined}
                min={0}
                style={{ flex: 1 }}
                {...form.getInputProps(`lines.${index}.priceAmount`)}
              />
              <Select
                label={index === 0 ? 'Tax' : undefined}
                data={Object.values(TaxCategoryEnum).map((category) => ({
                  value: category,
                  label: TaxCategoryLabel[category],
                }))}
                style={{ flex: 1 }}
                {...form.getInputProps(`lines.${index}.taxCategoryId`)}
              />
              <NumberInput
                label={index === 0 ? 'Tax %' : undefined}
                min={0}
                max={100}
                style={{ flex: 1 }}
                {...form.getInputProps(`lines.${index}.taxPercent`)}
              />
              <ActionIcon
                color="red"
                variant="subtle"
                disabled={form.values.lines.length === 1}
                onClick={() => form.removeListItem('lines', index)}
              >
                <IconTrash size="1rem" />
              </ActionIcon>
            </Group>
          ))}
          <Button
            variant="subtle"
            size="compact-sm"
            leftSection={<IconPlus size="0.9rem" />}
            onClick={() => form.insertListItem('lines', { ...emptyLine })}
          >
            Add line
          </Button>

          <Divider mt="xs" />
          <Group justify="flex-end" gap="xl">
            <Text size="sm" c="dimmed">
              Excl. tax: {totalExclTax.toFixed(2)} {form.values.documentCurrencyCode}
            </Text>
            <Text size="sm" c="dimmed">
              Tax: {totalTax.toFixed(2)} {form.values.documentCurrencyCode}
            </Text>
            <Text size="sm" fw={600}>
              Payable: {(totalExclTax + totalTax).toFixed(2)}{' '}
              {form.values.documentCurrencyCode}
            </Text>
          </Group>

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
        header: 'Payable amount',
        accessorFn: (row) =>
          `${Number(row.payableAmount).toLocaleString()} ${row.documentCurrencyCode}`,
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
        Invoices across all lending-product flows. Header and line items
        mirror the OASIS UBL 2.5 Invoice schema; status moves follow the
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
