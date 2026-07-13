import { Button, Group, Modal, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import useDeleteApiKey from 'hooks/useDeleteApiKey';
import React from 'react';
import { FC } from 'react';

interface IProps {
  id: number;
  name: string;
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DeleteApiKeyModal: FC<IProps> = (props) => {
  const { opened, onClose, onSuccess, id, name } = props;
  const deleteApiKeyMutation = useDeleteApiKey();

  const handleDelete = () => {
    deleteApiKeyMutation.mutate(
      { id },
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
      title="Confirm Deletion"
      centered
    >
      <Text>{`Are you sure you want to delete ${name}?`}</Text>

      <Group justify="flex-end" mt="xl">
        <Button
          color="gray"
          disabled={deleteApiKeyMutation.isLoading}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          color="red"
          loading={deleteApiKeyMutation.isLoading}
          onClick={handleDelete}
        >
          Delete
        </Button>
      </Group>
    </Modal>
  );
};

export default DeleteApiKeyModal;
