import useCreateWebhook from 'hooks/useCreateWebhook';
import React, { FC } from 'react';
import {
  Button,
  Checkbox,
  Group,
  MantineProvider,
  Modal,
  Space,
  Stack,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { WebhookEventType } from 'constants/enum';
import { EVENT_LABELS } from 'constants/webhook';

interface IProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateWebhookModal: FC<IProps> = (props) => {
  const createWebhookMutation = useCreateWebhook();
  const { opened, onClose, onSuccess } = props;

  const form = useForm<{
    name: string;
    url: string;
    apiKey: string;
    secretKey: string;
    eventTypes: WebhookEventType[];
  }>({
    initialValues: {
      name: '',
      url: '',
      apiKey: '',
      secretKey: '',
      eventTypes: [],
    },
    validate: {
      name: (v) => {
        if (!v) return 'Webhook name is required';
        if (v.length > 20) return 'Cannot exceed 20 characters';
        return null;
      },
      url: (v) => {
        if (!v) return 'Webhook URL is required';
        if (v.length > 200) return 'Cannot exceed 200 characters';
        return null;
      },
      apiKey: (v) => {
        if (!v) return 'API key is required';
        if (v.length > 64) return 'Cannot exceed 64 characters';

        return null;
      },
      secretKey: (v) => {
        if (!v) return 'Secret key is required';
        if (v.length > 64) return 'Cannot exceed 64 characters';

        return null;
      },
      eventTypes: (v) =>
        v.length > 0 ? null : 'At least one event type must be selected',
    },
  });

  const handleCreate = () => {
    const validation = form.validate();

    if (validation.hasErrors) {
      return;
    }

    const { name, url, apiKey, secretKey, eventTypes } = form.values;

    createWebhookMutation.mutate(
      { name, url, apiKey, secretKey, eventTypes },
      {
        onSuccess: () => {
          handleOnClose();
          onSuccess();
        },
        onError: (e) => {
          const message = (e as Error).message;

          notifications.show({
            id: 'error',
            title: 'Error',
            message,
            color: 'red',
            autoClose: 2000,
          });
        },
      }
    );
  };

  const handleOnClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      closeOnClickOutside={false}
      withCloseButton={false}
      opened={opened}
      onClose={onClose}
      title="Create Webhook"
      centered
    >
      <TextInput
        label="Webhook name"
        required
        placeholder="Enter a name"
        {...form.getInputProps('name')}
      />

      <TextInput
        mt="xs"
        label="Url"
        required
        placeholder="Enter a webhook url"
        {...form.getInputProps('url')}
      />

      <TextInput
        mt="xs"
        label="API key"
        required
        placeholder="Enter an API Key"
        {...form.getInputProps('apiKey')}
      />

      <TextInput
        mt="xs"
        label="Secret key"
        required
        placeholder="Enter a secret key"
        {...form.getInputProps('secretKey')}
      />

      <Checkbox.Group
        mt="xs"
        label="Event types"
        {...form.getInputProps('eventTypes')}
      >
        <Stack gap="xs" mt="xs">
          {Object.values(WebhookEventType).map((event) => (
            <MantineProvider theme={{ cursorType: 'pointer' }}>
              <Checkbox key={event} value={event} label={EVENT_LABELS[event]} />
            </MantineProvider>
          ))}
        </Stack>
      </Checkbox.Group>

      <Space h="xl" />

      <Group justify="flex-end">
        <Button
          disabled={createWebhookMutation.isLoading}
          color="gray"
          onClick={handleOnClose}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          loading={createWebhookMutation.isLoading}
        >
          Create
        </Button>
      </Group>
    </Modal>
  );
};

export default CreateWebhookModal;
