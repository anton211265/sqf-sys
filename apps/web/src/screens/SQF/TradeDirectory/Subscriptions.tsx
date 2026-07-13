import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import MantineTable from 'components/Table/MantineTable';
import {
  LendingProductEnum,
  LendingProductLabel,
  LendingProductSubscriptionStatusEnum,
} from 'constants/enum';
import { type MRT_ColumnDef } from 'mantine-react-table';
import React, { useMemo } from 'react';
import { ISubscription } from 'service/tradeDirectory';
import {
  useCreateSubscription,
  useSubscriptions,
  useUpdateSubscription,
} from 'hooks/useTradeDirectory';

const CreateSubscriptionModal: React.FC<{
  opened: boolean;
  onClose: () => void;
}> = ({ opened, onClose }) => {
  const createMutation = useCreateSubscription();

  const form = useForm({
    initialValues: {
      clientPersonaId: undefined as number | undefined,
      product: '' as string,
      facilityContractId: undefined as number | undefined,
    },
    validate: {
      clientPersonaId: (v) => (v ? null : 'Required'),
      product: (v) => (v ? null : 'Required'),
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    createMutation.mutate(
      {
        clientPersonaId: Number(values.clientPersonaId),
        product: values.product as LendingProductEnum,
        facilityContractId: values.facilityContractId,
      },
      {
        onSuccess: () => {
          notifications.show({ message: 'Subscription created', color: 'green' });
          form.reset();
          onClose();
        },
        onError: (error: any) => {
          notifications.show({
            title: 'Could not create subscription',
            message: error?.response?.data?.message ?? (error as Error).message,
            color: 'red',
          });
        },
      },
    );
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Subscribe client to product">
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <NumberInput
            label="Client persona ID"
            min={1}
            {...form.getInputProps('clientPersonaId')}
          />
          <Select
            label="Lending product"
            data={Object.values(LendingProductEnum).map((product) => ({
              value: product,
              label: LendingProductLabel[product],
            }))}
            {...form.getInputProps('product')}
          />
          <NumberInput
            label="Facility contract ID (optional)"
            min={1}
            {...form.getInputProps('facilityContractId')}
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" color="primary" loading={createMutation.isLoading}>
              Subscribe
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

const Subscriptions: React.FC = () => {
  const { data: subscriptions = [] } = useSubscriptions();
  const updateMutation = useUpdateSubscription();
  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);

  const setStatus = (
    subscription: ISubscription,
    status: LendingProductSubscriptionStatusEnum,
  ) => {
    updateMutation.mutate(
      { id: subscription.id, status },
      {
        onSuccess: () => {
          notifications.show({ message: `Subscription → ${status}`, color: 'green' });
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

  const columns = useMemo<MRT_ColumnDef<ISubscription>[]>(
    () => [
      {
        id: 'client',
        header: 'Client persona',
        accessorFn: (row) =>
          row.clientPersona?.clientPersonaId ?? `#${row.clientPersonaId}`,
      },
      {
        id: 'product',
        header: 'Product',
        accessorFn: (row) => LendingProductLabel[row.product] ?? row.product,
      },
      {
        id: 'facility',
        header: 'Facility contract',
        accessorFn: (row) =>
          row.facilityContract?.reference ??
          (row.facilityContractId ? `#${row.facilityContractId}` : '—'),
      },
      { accessorKey: 'status', header: 'Status' },
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
            data={Object.values(LendingProductSubscriptionStatusEnum).filter(
              (status) => status !== row.original.status,
            )}
            onChange={(value) =>
              value &&
              setStatus(
                row.original,
                value as LendingProductSubscriptionStatusEnum,
              )
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
        Product Subscriptions
      </Title>
      <Text c="dimmed" size="sm" mb="md">
        Which lending products each client is subscribed to, and the facility
        agreement backing each subscription.
      </Text>
      <MantineTable
        columns={columns}
        data={subscriptions}
        searchPlaceholder="Search subscriptions"
        pageSize={15}
        action={
          <Button
            color="primary"
            leftSection={<IconPlus size="1rem" />}
            onClick={openModal}
          >
            New subscription
          </Button>
        }
      />
      <CreateSubscriptionModal opened={modalOpened} onClose={closeModal} />
    </div>
  );
};

export default Subscriptions;
