import { notifications } from '@mantine/notifications';
import useGetTopics from 'hooks/useGetTopics';
import React, { FC, useMemo } from 'react';
import {
  ActionIcon,
  Box,
  Button,
  Divider,
  Group,
  Modal,
  Space,
  TextInput,
  Text,
  Switch,
  Select,
  MantineProvider,
} from '@mantine/core';
import useCreateMessage from 'hooks/useCreateMessage';
import { useForm } from '@mantine/form';
import { IconPlus, IconTrash } from '@tabler/icons-react';

interface IProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateMessage: FC<IProps> = (props) => {
  const { opened, onClose, onSuccess } = props;
  const {
    data: topics = [],
    error: topicsError,
    isLoading: topicsLoading,
  } = useGetTopics();
  const createMessageMutation = useCreateMessage();

  if (topicsError) {
    notifications.show({
      id: 'error',
      title: 'Error',
      message: (topicsError as Error).message,
      color: 'red',
      autoClose: 2000,
    });
  }

  const form = useForm({
    initialValues: {
      refId: '',
      eventName: '',
      newTopic: false,
      topicId: '',
      attributes: [{ dataType: '', hash: '' }],
    },
    validate: (values) => {
      const errors: Record<string, string | null> = {};

      if (!values.refId) {
        errors.refId = 'Ref ID is required';
      } else if (values.refId.length > 100) {
        errors.refId = `Cannot exceed 100 characters`;
      }

      if (!values.eventName) {
        errors.eventName = 'Event Name is required';
      } else if (values.eventName.length > 100) {
        errors.eventName = `Cannot exceed 100 characters`;
      }

      if (values.newTopic && !values.topicId) {
        errors.topicId = 'Select a Topic';
      }

      if (values.topicId && values.topicId.length > 20) {
        errors.topicId = `Cannot exceed 20 characters`;
      }

      if (values.attributes.length === 0) {
        errors.attributes = 'At least one attribute is required';

        return errors;
      } else {
        values.attributes.forEach((attribute, index) => {
          const dataTypeField = `attributes.${index}.dataType`;
          const hashField = `attributes.${index}.hash`;

          if (!attribute.dataType) {
            errors[dataTypeField] = 'Data Type is required';
          } else if (attribute.dataType.length > 100) {
            errors[dataTypeField] = `Cannot exceed 100 characters`;
          }

          if (!attribute.hash) {
            errors[hashField] = 'Hash is required';
          } else if (attribute.hash.length > 100) {
            errors[hashField] = `Cannot exceed 100 characters`;
          }
        });
      }

      return errors;
    },
  });

  const topicOptions = useMemo(
    () =>
      topics.map((t: string) => ({
        value: t,
        label: t,
      })),
    [topics]
  );

  const handleUpload = () => {
    if (form.validate().hasErrors) {
      return;
    }

    const { refId, eventName, attributes, topicId } = form.values;

    createMessageMutation.mutate(
      { refId, eventName, attributes, topicId },
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
      title="Create Message"
      centered
    >
      <TextInput
        label="Ref ID"
        placeholder="Enter a ref ID"
        required
        {...form.getInputProps('refId')}
      />
      <TextInput
        label="Event Name"
        placeholder="Enter a event name"
        required
        {...form.getInputProps('eventName')}
      />

      <Group mt="md" align="center">
        <Text size="sm">Append Existing Topic</Text>
        <MantineProvider theme={{ cursorType: 'pointer' }}>
          <Switch
            disabled={topicsLoading || topicOptions.length === 0}
            {...form.getInputProps('newTopic', { type: 'checkbox' })}
          />
        </MantineProvider>
      </Group>

      {form.values.newTopic && (
        <Select
          style={{ width: '150px' }}
          mt="md"
          label="Topic ID"
          placeholder="Select a topic"
          data={topicOptions}
          disabled={topicsLoading}
          required
          {...form.getInputProps('topicId')}
        />
      )}
      <Space h="xl" />

      <Text fw={250} size="xs">
        Attributes{' '}
        <Text component="span" c="red" inherit>
          *
        </Text>
      </Text>
      <Space h="xs" />
      {form.values.attributes.map((_, idx) => (
        <Box key={idx} mb="md">
          <ActionIcon
            size="xs"
            color="red"
            variant="light"
            onClick={() =>
              form.setFieldValue(
                'attributes',
                form.values.attributes.filter((_, i) => i !== idx)
              )
            }
          >
            <IconTrash />
          </ActionIcon>
          <TextInput
            label="Data Type"
            placeholder="Enter a data type"
            required
            {...form.getInputProps(`attributes.${idx}.dataType`)}
          />
          <TextInput
            label="Hash"
            placeholder="Enter a hash"
            required
            {...form.getInputProps(`attributes.${idx}.hash`)}
          />
          <Divider my="xl" />
        </Box>
      ))}

      <Button
        variant="outline"
        onClick={() =>
          form.setFieldValue('attributes', [
            ...form.values.attributes,
            { dataType: '', hash: '' },
          ])
        }
      >
        <Group gap="xs" align="center">
          <IconPlus size={16} />
          Add Attribute
        </Group>
      </Button>
      {form.errors.attributes && (
        <Text c="red" size="sm" mt="xs">
          {form.errors.attributes}
        </Text>
      )}
      <Space h="xl" />

      <Group justify="flex-end">
        <Button
          disabled={createMessageMutation.isLoading}
          color="gray"
          onClick={handleOnClose}
        >
          Cancel
        </Button>

        <Button
          loading={createMessageMutation.isLoading || topicsLoading}
          onClick={handleUpload}
        >
          Create
        </Button>
      </Group>
    </Modal>
  );
};

export default CreateMessage;
