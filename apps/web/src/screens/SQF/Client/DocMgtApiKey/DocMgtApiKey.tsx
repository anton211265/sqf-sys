import React, { FC, useMemo, useState } from 'react';
import styles from './DocMgtApiKey.module.css';
import { ActionIcon, Button, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import CreateApiKeyModal from './Components/CreateApiKeyModal';
import useGetApiKeys from 'hooks/useGetApiKeys';
import { notifications } from '@mantine/notifications';
import {
  MantineReactTable,
  MRT_ColumnDef,
  useMantineReactTable,
} from 'mantine-react-table';
import { IGetApiKeysResponse } from 'service/getApiKeys';
import { convertDate } from 'utils/date';
import CopyIcon from 'components/CopyButton/CopyButton';
import useDeleteApiKey from 'hooks/useDeleteApiKey';
import DeleteApiKeyModal from './Components/DeleteApiKeyModal';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import EditApiKeyModal, { ApiKeyData } from './Components/EditApiKeyModal';

const DocMgtApiKey: FC = () => {
  const { data = [], error, isLoading, refetch } = useGetApiKeys();
  const [opened, { open, close }] = useDisclosure(false);
  const deleteApiKeyMutation = useDeleteApiKey();
  const [apiKeyToDelete, setApiKeyToDelete] = useState<{
    id: number;
    name: string;
  }>({ id: 0, name: '' });
  const [
    deleteModalOpened,
    { open: deleteModalOpen, close: deleteModalClose },
  ] = useDisclosure(false);
  const [editModalOpened, { open: editModalOpen, close: editModalClose }] =
    useDisclosure(false);
  const [apiKeyToEdit, setApiKeyToEdit] = useState<ApiKeyData>({
    name: '',
    id: 0,
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

  const columns = useMemo<MRT_ColumnDef<IGetApiKeysResponse>[]>(
    () => [
      {
        accessorKey: 'name',
        id: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'key',
        id: 'key',
        header: 'API Key',
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
        accessorKey: 'createdAt',
        id: 'createdAt',
        header: 'Created Date',
        Cell: ({ cell }) => <p>{convertDate(cell.getValue<string>())}</p>,
      },
      {
        id: 'action',
        header: 'Action',
        enableSorting: false,
        Cell: ({ row }) => {
          const apiKey = row.original;

          return (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <ActionIcon
                onClick={() => handleEditClick(apiKey.id, apiKey.name)}
              >
                <IconPencil size={16} />
              </ActionIcon>
              <ActionIcon
                color="red"
                onClick={() => handleDeleteClick(apiKey.id, apiKey.name)}
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

  const handleDeleteClick = (id: number, name: string) => {
    setApiKeyToDelete({ id, name });
    deleteModalOpen();
  };

  const handleEditClick = (id: number, name: string) => {
    setApiKeyToEdit({ id, name });
    editModalOpen();
  };

  const table = useMantineReactTable({
    enableColumnActions: false,
    enableColumnFilters: false,
    paginationDisplayMode: 'pages',
    state: { isLoading },
    columns,
    data: data,
    initialState: { density: 'xs' },
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>API Keys</h1>
        <Button onClick={open}>Generate API Key</Button>
      </div>
      <MantineReactTable table={table} />

      <CreateApiKeyModal opened={opened} onClose={close} onSuccess={refetch} />

      <DeleteApiKeyModal
        opened={deleteModalOpened}
        onClose={deleteModalClose}
        onSuccess={refetch}
        id={apiKeyToDelete.id}
        name={apiKeyToDelete.name}
      />

      <EditApiKeyModal
        opened={editModalOpened}
        onClose={editModalClose}
        onSuccess={refetch}
        apiKeyData={apiKeyToEdit}
      />
    </div>
  );
};

export default DocMgtApiKey;
