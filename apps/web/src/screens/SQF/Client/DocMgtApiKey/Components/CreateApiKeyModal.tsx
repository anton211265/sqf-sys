import { Button, Group, Modal, Space, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import useGenerateApiKey from 'hooks/useGenerateApiKey';
import React, { FC } from 'react';

interface IProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateApiKeyModal: FC<IProps> = (props) => {
  const generateApiKeyMutation = useGenerateApiKey();
  const { opened, onClose, onSuccess } = props;

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

  const handleGenerate = () => {
    const validation = form.validate();

    if (validation.hasErrors) {
      return;
    }

    generateApiKeyMutation.mutate(
      { name: form.values.name },
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
      title="Create API Key"
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
          disabled={generateApiKeyMutation.isLoading}
          onClick={handleOnClose}
        >
          Cancel
        </Button>
        <Button
          onClick={handleGenerate}
          loading={generateApiKeyMutation.isLoading}
        >
          Create
        </Button>
      </Group>
    </Modal>
  );
};

export default CreateApiKeyModal;
