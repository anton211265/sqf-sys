import {
  Button,
  FileInput,
  Group,
  Modal,
  Select,
  Space,
  Stack,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import useGetTemplates from 'hooks/useGetTemplates';
import useUploadExtraction from 'hooks/useUploadExtraction';
import React, { FC, useMemo } from 'react';
import { IGetTemplatesResponse } from 'service/getTemplates';

interface IProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UploadDocExtraction: FC<IProps> = (props) => {
  const {
    data: templates = [],
    error: templatesError,
    isLoading: templatesLoading,
  } = useGetTemplates();
  const { opened, onClose, onSuccess } = props;
  const uploadExtractionMutation = useUploadExtraction();

  if (templatesError) {
    notifications.show({
      id: 'error',
      title: 'Error',
      message: (templatesError as Error).message,
      color: 'red',
      autoClose: 2000,
    });
  }

  const templateOptions = useMemo(
    () =>
      templates.map((t: IGetTemplatesResponse) => ({
        value: t.templateId,
        label: `${t.name} - ${t.templateId}`,
      })),
    [templates]
  );

  const form = useForm<{
    refId: string;
    documentType: string;
    templateId: string;
    file: File | null;
  }>({
    initialValues: {
      refId: '',
      documentType: '',
      templateId: '',
      file: null,
    },
    validate: {
      refId: (v) =>
        !v
          ? 'Ref ID is required'
          : v.length > 100
            ? 'Cannot exceed 100 characters'
            : null,
      documentType: (v) =>
        !v
          ? 'Document Type is required'
          : v.length > 100
            ? 'Cannot exceed 100 characters'
            : null,
      templateId: (v) => (!v ? 'Template selection is required' : null),
      file: (v) => {
        if (!v) {
          return 'File is required';
        }
        if (v.size > 100 * 1024 * 1024) {
          return 'File must be under 100 MB';
        }
        return null;
      },
    },
  });

  const handleUpload = () => {
    if (form.validate().hasErrors) {
      return;
    }

    const { templateId, refId, documentType } = form.values;

    uploadExtractionMutation.mutate(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      { file: form.values.file!, templateId, refId, documentType },
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
      title="Upload Document for Extraction"
      centered
    >
      <Stack>
        <TextInput
          label="Ref ID"
          required
          placeholder="Enter ref ID"
          {...form.getInputProps('refId')}
        />

        <TextInput
          label="Document Type"
          required
          placeholder="Enter document type"
          {...form.getInputProps('documentType')}
        />

        <Select
          label="Template"
          required
          placeholder="Choose a template"
          data={templateOptions}
          disabled={templatesLoading || templateOptions.length === 0}
          {...form.getInputProps('templateId')}
        />

        <FileInput
          label="File"
          required
          placeholder="Select PDF or image"
          accept="application/pdf,image/png,image/jpeg"
          {...form.getInputProps('file')}
        />
      </Stack>
      <Space h="xl" />

      <Group justify="flex-end">
        <Button
          disabled={uploadExtractionMutation.isLoading}
          color="gray"
          onClick={handleOnClose}
        >
          Cancel
        </Button>

        <Button
          loading={uploadExtractionMutation.isLoading || templatesLoading}
          onClick={handleUpload}
        >
          Upload
        </Button>
      </Group>
    </Modal>
  );
};

export default UploadDocExtraction;
