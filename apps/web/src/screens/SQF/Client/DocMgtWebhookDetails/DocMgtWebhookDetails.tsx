import { notifications } from '@mantine/notifications';
import useGetWebhookDetails from 'hooks/useGetWebhookDetails';
import React, { FC, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import styles from './DocMgtWebhookDetails.module.css';
import {
  Badge,
  Box,
  Button,
  Card,
  Grid,
  LoadingOverlay,
  Space,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import ItemRow from 'components/ItemRow/ItemRow';
import {
  MantineReactTable,
  MRT_ColumnDef,
  useMantineReactTable,
} from 'mantine-react-table';
import { IWebhookLog } from 'service/getWebhookDetails';
import { convertDate } from 'utils/date';
import { EVENT_LABELS, STATUS_LABELS } from 'constants/webhook';
import { WebhookEventType, WebhookLogStatus } from 'constants/enum';
import { JsonView } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import UpdateWebhookModal from './Components/UpdateWebhookModal';
import { IUpdateWebhookRequest } from 'service/updateWebhook';

const DocMgtWebhookDetails: FC = () => {
  const params = useParams();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const id = params.id!;
  const { data, error, isLoading, refetch } = useGetWebhookDetails(id);
  const [opened, { open, close }] = useDisclosure(false);
  const name = data?.name || '-';
  const apiKey = data?.apiKey || '-';
  const secretkey = data?.secretKey || '-';
  const url = data?.url || '-';
  const logs = data?.logs || [];
  const isActive = data?.isActive ? true : false;
  const status = data?.isActive ? 'Enabled' : 'Disabled';
  const createdAt = data?.createdAt || '-';
  const eventTypes = data?.eventTypes || [];
  const webhookData: IUpdateWebhookRequest = {
    name,
    apiKey,
    secretKey: secretkey,
    url,
    eventTypes,
    webhookId: id,
    isActive,
  };

  if (error) {
    notifications.show({
      id: 'error',
      title: 'Error',
      message: (error as Error).message,
      color: 'red',
      autoClose: 2000,
    });
  }

  const columns = useMemo<MRT_ColumnDef<IWebhookLog>[]>(
    () => [
      {
        accessorKey: 'url',
        id: 'url',
        header: 'Url',
      },
      {
        accessorKey: 'requestId',
        id: 'requestId',
        header: 'Request ID',
      },
      {
        accessorKey: 'eventType',
        id: 'eventType',
        header: 'Event Type',
        Cell: ({ cell }) => {
          const raw = cell.getValue<WebhookEventType>();
          const label = EVENT_LABELS[raw] ?? raw;
          return <span>{label}</span>;
        },
      },
      {
        accessorKey: 'status',
        id: 'status',
        header: 'Status',
        Cell: ({ cell }) => {
          const raw = cell.getValue<WebhookLogStatus>();
          const label = STATUS_LABELS[raw] ?? raw;

          return (
            <Badge
              color={raw === WebhookLogStatus.SENT ? 'green' : 'red'}
              variant="filled"
            >
              {label}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        id: 'createdAt',
        header: 'Sent Date',
        Cell: ({ cell }) => <p>{convertDate(cell.getValue<string>())}</p>,
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
    data: logs || [],
    initialState: { density: 'xs' },
    renderDetailPanel: ({ row }) => (
      <div>
        <Text>Request Body:</Text>
        <Space h="sm" />
        <JsonView data={row.original.requestBody} />

        <Space h="lg" />
        <Text>Response:</Text>
        <Space h="sm" />
        <JsonView
          data={{
            responseStatus: row.original.responseStatus,
            responseBody: row.original.responseBody,
            responseHeaders: row.original.responseHeaders,
            errorMessage: row.original.errorMessage,
          }}
        />
      </div>
    ),
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Webhook <Text c="dimmed">{id}</Text>
        </h1>
        <Button disabled={!!error} onClick={open}>
          Edit Webhook
        </Button>
      </div>
      <Box pos="relative">
        <LoadingOverlay visible={isLoading} />
        <Card withBorder shadow="sm" padding="lg" radius="md">
          <Grid>
            <Grid.Col span={6}>
              <ItemRow label="Name:" value={name} />
              <ItemRow label="Url:" value={url} />
              <ItemRow
                label="Event Types:"
                value={
                  eventTypes.length > 0
                    ? eventTypes.map((e) => EVENT_LABELS[e]).join(', ')
                    : '-'
                }
              />
              <ItemRow label="Created Date:" value={createdAt} />
            </Grid.Col>
            <Grid.Col span={6}>
              <ItemRow label="API Key:" value={apiKey} />
              <ItemRow label="Secret Key:" value={secretkey} />
              <ItemRow label="Status:" value={status} />
            </Grid.Col>
          </Grid>
        </Card>
      </Box>
      <Space h="xl" />
      <h1 className={styles.title}>Logs</h1>
      <Space h="lg" />
      <MantineReactTable table={table} />
      <UpdateWebhookModal
        webhookData={webhookData}
        opened={opened}
        onClose={close}
        onSuccess={refetch}
      />
    </div>
  );
};

export default DocMgtWebhookDetails;
