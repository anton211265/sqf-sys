import { notifications } from '@mantine/notifications';
import useGetWebhooks from 'hooks/useGetWebhooks';
import {
  MantineReactTable,
  MRT_ColumnDef,
  useMantineReactTable,
} from 'mantine-react-table';
import React, { FC, useMemo } from 'react';
import { IGetWebhooksResponse } from 'service/getWebhooks';
import { convertDate } from 'utils/date';
import styles from './DocMgtWebhooks.module.css';
import { useDisclosure } from '@mantine/hooks';
import { ActionIcon, Badge, Button, Text } from '@mantine/core';
import CreateWebhookModal from './Components/CreateWebhookModal';
import { useNavigate } from 'react-router-dom';
import { toRouteStr } from 'utils/route';
import { CLIENT_DASHBOARD } from 'constants/routes';
import { WebhookEventType } from 'constants/enum';
import { EVENT_LABELS } from 'constants/webhook';
import { IconEye } from '@tabler/icons-react';

const DocMgtWebhooks: FC = () => {
  const { data = [], error, isLoading, refetch } = useGetWebhooks();
  const [opened, { open, close }] = useDisclosure(false);
  const navigate = useNavigate();

  if (error) {
    notifications.show({
      id: 'error',
      title: 'Error',
      message: (error as Error).message,
      color: 'red',
      autoClose: 2000,
    });
  }

  const columns = useMemo<MRT_ColumnDef<IGetWebhooksResponse>[]>(
    () => [
      {
        accessorKey: 'name',
        id: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'url',
        id: 'url',
        header: 'Url',
      },
      {
        accessorKey: 'eventTypes',
        id: 'eventTypes',
        header: 'Event Types',
        enableSorting: false,
        Cell: ({ cell }) => {
          const eventTypes = cell.getValue<WebhookEventType[]>();
          return (
            <Text>{eventTypes.map((e) => EVENT_LABELS[e]).join(', ')}</Text>
          );
        },
      },
      {
        accessorKey: 'isActive',
        id: 'status',
        header: 'Status',
        Cell: ({ cell }) => {
          const active = cell.getValue<boolean>();
          return (
            <Badge color={active ? 'green' : 'red'} variant="filled">
              {active ? 'Enabled' : 'Disabled'}
            </Badge>
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
        enableColumnFilter: false,
        Cell: ({ row }) => {
          const template = row.original;

          return (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <ActionIcon
                onClick={() =>
                  navigate(
                    toRouteStr(CLIENT_DASHBOARD.DOC_MGT_WEBHOOK_DETAILS, {
                      id: row.original.webhookId,
                    })
                  )
                }
              >
                <IconEye size={16} />
              </ActionIcon>
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useMantineReactTable({
    enableColumnActions: false,
    enableColumnFilters: false,
    paginationDisplayMode: 'pages',
    state: { isLoading },
    columns,
    data,
    initialState: { density: 'xs' },
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Webhooks</h1>
        <Button onClick={open}>Create Webhook</Button>
      </div>
      <MantineReactTable table={table} />

      <CreateWebhookModal opened={opened} onClose={close} onSuccess={refetch} />
    </div>
  );
};

export default DocMgtWebhooks;
