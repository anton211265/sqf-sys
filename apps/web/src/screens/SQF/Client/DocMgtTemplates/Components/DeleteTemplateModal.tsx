import { Button, Group, Modal, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import useDeleteTemplate from 'hooks/useDeleteTemplate';
import React from 'react';
import { FC } from 'react';

interface IProps {
  id: string;
  name: string;
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DeleteTemplateModal: FC<IProps> = (props) => {
  const { opened, onClose, onSuccess, id, name } = props;
  const deleteTemplateMutation = useDeleteTemplate();

  const handleDelete = () => {
    deleteTemplateMutation.mutate(
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
          disabled={deleteTemplateMutation.isLoading}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          color="red"
          loading={deleteTemplateMutation.isLoading}
          onClick={handleDelete}
        >
          Delete
        </Button>
      </Group>
    </Modal>
  );
};

export default DeleteTemplateModal;
