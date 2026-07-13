import {
  ActionIcon,
  Box,
  Button,
  Group,
  Modal,
  Select,
  Stepper,
  Textarea,
  TextInput,
  Text,
  Space,
  Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { FORMAT_OPTIONS } from 'constants/documentExtraction';
import { LLMProvider } from 'constants/enum';
import { LLM_LABELS } from 'constants/llm';
import useCreateTemplate from 'hooks/useCreateTemplate';
import React from 'react';
import { FC, useState } from 'react';

interface IProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTemplateModal: FC<IProps> = (props) => {
  const { opened, onClose, onSuccess } = props;
  const createTemplateMutation = useCreateTemplate();
  const [activeStep, setActiveStep] = useState(0);

  const form = useForm({
    initialValues: {
      templateName: '',
      llmProvider: '',
      prompts: [{ keyToExtract: '', format: 'string', description: '' }],
    },
    validate: (values) => {
      if (activeStep === 0) {
        const errors: Record<string, string | null> = {};

        if (!values.templateName) {
          errors.templateName = 'Template name is required';
        } else if (values.templateName.length > 20) {
          errors.templateName = `Cannot exceed 20 characters`;
        }

        if (!values.llmProvider) {
          errors.llmProvider = 'LLM is required';
        }

        return errors;
      }

      if (activeStep === 1) {
        const errors: Record<string, string> = {};

        if (values.prompts.length === 0) {
          errors['prompts'] = 'At least one prompt is required';

          return errors;
        }

        values.prompts.forEach((prompt, index) => {
          const keyToExtractField = `prompts.${index}.keyToExtract`;
          const descriptionField = `prompts.${index}.description`;

          if (!prompt.keyToExtract) {
            errors[keyToExtractField] = 'Name is required';
          } else if (prompt.keyToExtract.length > 20) {
            errors[keyToExtractField] = `Cannot exceed 20 characters`;
          }

          if (!prompt.format) {
            errors[`prompts.${index}.format`] = 'Format is required';
          }
          if (!prompt.description) {
            errors[descriptionField] = 'Prompt is required';
          } else if (prompt.description.length > 500) {
            errors[descriptionField] = `Cannot exceed 500 characters`;
          }
        });

        return errors;
      }

      return {};
    },
  });

  const next = () => {
    if (form.validate().hasErrors) {
      return;
    }

    if (activeStep === 0) {
      setActiveStep(1);
    }

    if (activeStep === 1) {
      setActiveStep(2);
    }

    if (activeStep === 2) {
      handleSubmit();
    }
  };

  const prev = () => setActiveStep((s) => Math.max(s - 1, 0));

  const handleSubmit = () => {
    const { templateName, prompts, llmProvider } = form.values;

    createTemplateMutation.mutate(
      {
        name: templateName,
        prompt: prompts,
        llmProvider: llmProvider as LLMProvider,
      },
      {
        onSuccess: () => {
          handleOnClose();
          setActiveStep(0);
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
      title="Create Template"
      centered
    >
      <Stepper active={activeStep}>
        <Stepper.Step label="Info">
          <TextInput
            label="Template Name"
            placeholder="Enter a name"
            required
            {...form.getInputProps('templateName')}
          />
          <Select
            mt="md"
            label="LLM"
            placeholder="Choose one"
            required
            data={Object.values(LLMProvider).map((p) => ({
              value: p,
              label: LLM_LABELS[p],
            }))}
            {...form.getInputProps('llmProvider')}
          />
        </Stepper.Step>

        <Stepper.Step label="Prompts">
          {form.values.prompts.map((_, idx) => (
            <Box key={idx} mb="md">
              <ActionIcon
                size="xs"
                color="red"
                variant="light"
                onClick={() =>
                  form.setFieldValue(
                    'prompts',
                    form.values.prompts.filter((_, i) => i !== idx)
                  )
                }
              >
                <IconTrash />
              </ActionIcon>
              <Group align="flex-start">
                <TextInput
                  label="Name"
                  placeholder="e.g. companyName"
                  required
                  {...form.getInputProps(`prompts.${idx}.keyToExtract`)}
                />
                <Select
                  label="Format"
                  required
                  placeholder="Choose one"
                  data={FORMAT_OPTIONS}
                  {...form.getInputProps(`prompts.${idx}.format`)}
                />
              </Group>
              <Textarea
                mt="sm"
                resize="vertical"
                label="Prompt"
                placeholder="Type your prompt here…"
                required
                minRows={2}
                {...form.getInputProps(`prompts.${idx}.description`)}
              />
              <Divider my="xl" />
            </Box>
          ))}

          <Button
            variant="outline"
            onClick={() =>
              form.setFieldValue('prompts', [
                ...form.values.prompts,
                { keyToExtract: '', format: 'string', description: '' },
              ])
            }
          >
            <Group gap="xs" align="center">
              <IconPlus size={16} />
              Add Prompt
            </Group>
          </Button>
          {form.errors.prompts && (
            <Text c="red" size="sm" mt="xs">
              {form.errors.prompts}
            </Text>
          )}
        </Stepper.Step>

        <Stepper.Step label="Review">
          <Text fw={700}>Template Name:</Text>
          <Text mb="md">{form.values.templateName}</Text>

          <Text fw={700}>LLM:</Text>
          <Text mb="md">
            {LLM_LABELS[form.values.llmProvider as LLMProvider]}
          </Text>

          <Text fw={700}>Prompts:</Text>
          {form.values.prompts.map((p, i) => (
            <Box key={i} mb="sm">
              <Text>
                {p.keyToExtract} ({p.format})
              </Text>
              <Text size="sm">{p.description}</Text>
            </Box>
          ))}
        </Stepper.Step>
      </Stepper>

      <Space h="xl" />

      <Group justify="flex-end">
        {activeStep === 0 && (
          <Button color="gray" onClick={handleOnClose}>
            Cancel
          </Button>
        )}
        {activeStep > 0 && (
          <Button
            color="gray"
            disabled={createTemplateMutation.isLoading}
            onClick={prev}
          >
            Back
          </Button>
        )}
        {activeStep < 2 && <Button onClick={next}>Next</Button>}
        {activeStep === 2 && (
          <Button loading={createTemplateMutation.isLoading} onClick={next}>
            Create
          </Button>
        )}
      </Group>
    </Modal>
  );
};

export default CreateTemplateModal;
