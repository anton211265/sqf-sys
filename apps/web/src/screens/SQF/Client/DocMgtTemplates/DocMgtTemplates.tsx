import React, { FC, useMemo, useState } from 'react';
import styles from './DocMgtTemplates.module.css';
import { useDisclosure } from '@mantine/hooks';
import { ActionIcon, Button, Space, Text } from '@mantine/core';
import {
  MantineReactTable,
  MRT_ColumnDef,
  useMantineReactTable,
} from 'mantine-react-table';
import { IGetTemplatesResponse } from 'service/getTemplates';
import { convertDate } from 'utils/date';
import useGetTemplates from 'hooks/useGetTemplates';
import { notifications } from '@mantine/notifications';
import { LLM_LABELS } from 'constants/llm';
import { LLMProvider } from 'constants/enum';
import CopyIcon from 'components/CopyButton/CopyButton';
import CreateTemplateModal from './Components/CreateTemplateModal';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import DeleteTemplateModal from './Components/DeleteTemplateModal';
import EditTemplateModal, { TemplateData } from './Components/EditTemplate';
import { Prompt } from 'service/createTemplate';
import { JsonView } from 'react-json-view-lite';

const DocMgtTemplates: FC = () => {
  const { data = [], error, isLoading, refetch } = useGetTemplates();
  const [opened, { open, close }] = useDisclosure(false);
  const [
    deleteModalOpened,
    { open: deleteModalOpen, close: deleteModalClose },
  ] = useDisclosure(false);
  const [templateToDelete, setTemplateToDelete] = useState<{
    id: string;
    name: string;
  }>({ id: '', name: '' });
  const [editModalOpened, { open: editModalOpen, close: editModalClose }] =
    useDisclosure(false);
  const [templateToEdit, setTemplateToEdit] = useState<TemplateData>({
    templateId: '',
    name: '',
    llmProvider: LLMProvider.DEEPSEEK,
    prompt: [],
  });

  if (error) {
    notifications.show({
      id: 'error',
      title: 'Error',
      message: (error as Error).message,
      color: 'red',
      autoClose: 2000,
    });
  }

  const columns = useMemo<MRT_ColumnDef<IGetTemplatesResponse>[]>(
    () => [
      {
        accessorKey: 'name',
        id: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'templateId',
        id: 'templateId',
        header: 'Template ID',
        enableSorting: false,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return (
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span style={{ wordBreak: 'break-all' }}>{value}</span>
              <CopyIcon value={value} />
            </div>
          );
        },
      },
      {
        accessorKey: 'llmProvider',
        id: 'llmProvider',
        header: 'LLM',
        Cell: ({ cell }) => {
          const raw = cell.getValue<LLMProvider>();
          const label = LLM_LABELS[raw] ?? raw;

          return label;
        },
      },
      {
        accessorKey: 'numberOfPrompts',
        id: 'numberOfPrompts',
        header: 'Number of Prompts',
      },
      {
        accessorKey: 'createdAt',
        id: 'createdAt',
        header: 'Created Date',
        Cell: ({ cell }) => <p>{convertDate(cell.getValue<string>())}</p>,
      },
      {
        id: 'action',
        header: 'Action',
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) => {
          const template = row.original;

          return (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <ActionIcon
                onClick={() =>
                  handleEditClick(
                    template.templateId,
                    template.name,
                    template.llmProvider,
                    template.prompt
                  )
                }
              >
                <IconPencil size={16} />
              </ActionIcon>
              <ActionIcon
                color="red"
                onClick={() =>
                  handleDeleteClick(template.templateId, template.name)
                }
              >
                <IconTrash size={16} />
              </ActionIcon>
            </div>
          );
        },
      },
    ],
    []
  );

  const handleDeleteClick = (id: string, name: string) => {
    setTemplateToDelete({ id, name });
    deleteModalOpen();
  };

  const handleEditClick = (
    id: string,
    name: string,
    llmProvider: LLMProvider,
    prompt: Prompt[]
  ) => {
    setTemplateToEdit({ templateId: id, name, llmProvider, prompt });
    editModalOpen();
  };

  const table = useMantineReactTable({
    enableColumnActions: false,
    enableColumnFilters: false,
    paginationDisplayMode: 'pages',
    state: { isLoading },
    columns,
    data,
    initialState: { density: 'xs' },
    renderDetailPanel: ({ row }) => (
      <div>
        <Text>Prompts:</Text>
        <Space h="sm" />
        <JsonView data={row.original.prompt} />
      </div>
    ),
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Prompt Templates</h1>
        <Button onClick={open}>Create Prompt Template</Button>
      </div>
      <MantineReactTable table={table} />

      <CreateTemplateModal
        opened={opened}
        onClose={close}
        onSuccess={refetch}
      />

      <DeleteTemplateModal
        opened={deleteModalOpened}
        onClose={deleteModalClose}
        onSuccess={refetch}
        id={templateToDelete.id}
        name={templateToDelete.name}
      />

      <EditTemplateModal
        opened={editModalOpened}
        onClose={editModalClose}
        onSuccess={refetch}
        templateData={templateToEdit}
      />
    </div>
  );
};

export default DocMgtTemplates;
