import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import React from 'react';
import { useCreateRelationship, useDirectoryOrganizations } from 'hooks/useTradeDirectory';

interface Props {
  opened: boolean;
  onClose: () => void;
  // Pre-select one side when opened from an organization profile.
  fixedFromOrganizationId?: number;
}

const CreateRelationshipModal: React.FC<Props> = ({
  opened,
  onClose,
  fixedFromOrganizationId,
}) => {
  const { data: organizations = [] } = useDirectoryOrganizations();
  const createMutation = useCreateRelationship();

  const form = useForm({
    initialValues: {
      fromOrganizationId: fixedFromOrganizationId
        ? String(fixedFromOrganizationId)
        : '',
      toOrganizationId: '',
      paymentTermsDays: undefined as number | undefined,
      totalTradeVolume: undefined as number | undefined,
      yearlyVolumeChangePct: undefined as number | undefined,
    },
    validate: {
      fromOrganizationId: (v) => (v ? null : 'Supplier organisation required'),
      toOrganizationId: (v, values) =>
        !v
          ? 'Buyer organisation required'
          : v === values.fromOrganizationId
            ? 'Must differ from supplier'
            : null,
    },
  });

  const organizationOptions = organizations.map((organization) => ({
    value: String(organization.id),
    label: organization.organizationName,
  }));

  const handleSubmit = form.onSubmit((values) => {
    createMutation.mutate(
      {
        fromOrganizationId: Number(values.fromOrganizationId),
        toOrganizationId: Number(values.toOrganizationId),
        paymentTermsDays: values.paymentTermsDays,
        totalTradeVolume: values.totalTradeVolume,
        yearlyVolumeChangePct: values.yearlyVolumeChangePct,
      },
      {
        onSuccess: () => {
          notifications.show({
            message: 'Relationship created',
            color: 'green',
          });
          form.reset();
          onClose();
        },
        onError: (error: any) => {
          notifications.show({
            title: 'Could not create relationship',
            message:
              error?.response?.data?.message ?? (error as Error).message,
            color: 'red',
          });
        },
      },
    );
  });

  return (
    <Modal opened={opened} onClose={onClose} title="New supply relationship">
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <Select
            label="Supplier (supplies to…)"
            data={organizationOptions}
            searchable
            disabled={!!fixedFromOrganizationId}
            {...form.getInputProps('fromOrganizationId')}
          />
          <Select
            label="Buyer"
            data={organizationOptions}
            searchable
            {...form.getInputProps('toOrganizationId')}
          />
          <NumberInput
            label="Payment terms (days)"
            min={0}
            {...form.getInputProps('paymentTermsDays')}
          />
          <NumberInput
            label="Total trade volume (MYR)"
            min={0}
            thousandSeparator=","
            {...form.getInputProps('totalTradeVolume')}
          />
          <NumberInput
            label="YoY volume change (%)"
            {...form.getInputProps('yearlyVolumeChangePct')}
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              loading={createMutation.isLoading}
            >
              Create
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default CreateRelationshipModal;
