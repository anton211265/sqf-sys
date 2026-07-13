import { Button, Group, Modal, TextInput, Space } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import useEditApiKey from 'hooks/useEditApiKey';
import React, { FC, useEffect } from 'react';

export interface ApiKeyData {
  id: number;
  name: string;
}

interface IProps {
  apiKeyData: ApiKeyData;
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditApiKeyModal: FC<IProps> = (props) => {
  const { opened, onClose, onSuccess, apiKeyData } = props;
  const editApiKeyMutation = useEditApiKey();

  const form = useForm<{ name: string }>({
    initialValues: { name: '' },
    validate: {
      name: (value) => {
        if (!value) {
          return 'API key name is required';
        }
        if (value.length > 20) {
          return 'Cannot exceed 20 characters';
        }
        return null;
      },
    },
  });

  useEffect(() => {
    if (opened) {
      form.setValues({ name: apiKeyData.name });
    }
  }, [opened, name]);

  const handleEdit = () => {
    const validation = form.validate();

    if (validation.hasErrors) {
      return;
    }

    editApiKeyMutation.mutate(
      { name: form.values.name, id: apiKeyData.id },
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
      title="Edit API Key"
      centered
    >
      <TextInput
        label="API key name"
        required
        placeholder="Enter a name"
        {...form.getInputProps('name')}
      />

      <Space h="xl" />

      <Group justify="flex-end">
        <Button
          color="gray"
          disabled={editApiKeyMutation.isLoading}
          onClick={handleOnClose}
        >
          Cancel
        </Button>
        <Button onClick={handleEdit} loading={editApiKeyMutation.isLoading}>
          Save
        </Button>
      </Group>
    </Modal>
  );
};

export default EditApiKeyModal;
