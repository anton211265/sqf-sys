import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { WebhookEventType } from 'constants/enum';
import useUpdateWebhook from 'hooks/updateWebhook';
import React, { FC, useEffect } from 'react';
import { IUpdateWebhookRequest } from 'service/updateWebhook';
import {
  Button,
  Checkbox,
  Group,
  MantineProvider,
  Modal,
  Space,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import { EVENT_LABELS } from 'constants/webhook';

interface IProps {
  webhookData: IUpdateWebhookRequest;
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UpdateWebhookModal: FC<IProps> = (props) => {
  const { webhookData, opened, onClose, onSuccess } = props;
  const updateWebhookMutation = useUpdateWebhook();
  const { webhookId, name, url, eventTypes, apiKey, secretKey, isActive } =
    webhookData;

  const form = useForm<{
    name: string;
    url: string;
    apiKey: string;
    secretKey: string;
    eventTypes: WebhookEventType[];
    isActive: boolean;
  }>({
    initialValues: {
      name,
      url,
      apiKey,
      secretKey,
      eventTypes,
      isActive,
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

  useEffect(() => {
    if (opened) {
      form.setValues(webhookData);
    }
  }, [opened, webhookData]);

  const handleUpdate = () => {
    const validation = form.validate();

    if (validation.hasErrors) {
      return;
    }

    const {
      name: formName,
      url: formUrl,
      apiKey: formApiKey,
      secretKey: formSecretKey,
      eventTypes: formEventTypes,
      isActive: formIsActive,
    } = form.values;

    updateWebhookMutation.mutate(
      {
        isActive: formIsActive,
        webhookId,
        name: formName,
        url: formUrl,
        apiKey: formApiKey,
        secretKey: formSecretKey,
        eventTypes: formEventTypes,
      },
      {
        onSuccess: () => {
          onClose();
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

  return (
    <Modal
      closeOnClickOutside={false}
      withCloseButton={false}
      opened={opened}
      onClose={onClose}
      title="Edit Webhook"
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

      <Space h="lg" />
      <Group align="center">
        <Text size="sm">Enabled</Text>
        <Switch {...form.getInputProps('isActive', { type: 'checkbox' })} />
      </Group>

      <Space h="xl" />

      <Group justify="flex-end">
        <Button
          disabled={updateWebhookMutation.isLoading}
          color="gray"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpdate}
          loading={updateWebhookMutation.isLoading}
        >
          Save
        </Button>
      </Group>
    </Modal>
  );
};

export default UpdateWebhookModal;
