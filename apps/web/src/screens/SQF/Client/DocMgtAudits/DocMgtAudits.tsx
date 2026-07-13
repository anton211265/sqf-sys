import { notifications } from '@mantine/notifications';
import { AUDIT_STATUS_LABELS } from 'constants/audit';
import { OnchainStatus } from 'constants/enum';
import useGetAudits from 'hooks/useGetAudits';
import {
  MantineReactTable,
  MRT_ColumnDef,
  useMantineReactTable,
} from 'mantine-react-table';
import React, { FC, useMemo, useState } from 'react';
import { IGetAuditsResponse } from 'service/getAudits';
import { Badge, Button, Select, Text } from '@mantine/core';
import { convertDate } from 'utils/date';
import styles from './DocMgtAudits.module.css';
import CopyIcon from 'components/CopyButton/CopyButton';
import Link from 'components/Link/Link';
import { useDisclosure } from '@mantine/hooks';
import CreateMessage from './Components/CreateMessage';

const DocMgtAudits: FC = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const noStatusFilter = 'ALL';
  const [status, setStatus] = useState(noStatusFilter);
  const statusFilters = [
    noStatusFilter,
    OnchainStatus.PENDING_WEBHOOK.toUpperCase(),
    OnchainStatus.PARTIAL_COMPLETED.toUpperCase(),
    OnchainStatus.COMPLETED.toUpperCase(),
    OnchainStatus.FAILED.toUpperCase(),
  ];
  const {
    data = [],
    error,
    isLoading,
    refetch,
  } = useGetAudits(status !== noStatusFilter ? status.toLowerCase() : '');

  if (error) {
    notifications.show({
      id: 'error',
      title: 'Error',
      message: (error as Error).message,
      color: 'red',
      autoClose: 2000,
    });
  }

  const columns = useMemo<MRT_ColumnDef<IGetAuditsResponse>[]>(
    () => [
      {
        accessorKey: 'requestId',
        id: 'requestId',
        header: 'Request ID',
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
        accessorKey: 'refId',
        id: 'refId',
        header: 'Ref ID',
      },
      {
        accessorKey: 'eventName',
        id: 'eventName',
        header: 'Event Name',
      },
      {
        accessorKey: 'status',
        id: 'status',
        header: 'Status',
        enableSorting: false,
        Cell: ({ cell }) => {
          const status = cell.getValue<OnchainStatus>();
          const label = AUDIT_STATUS_LABELS[status];

          const color =
            status === OnchainStatus.COMPLETED
              ? 'green'
              : status === OnchainStatus.FAILED
                ? 'red'
                : 'yellow';

          return <Badge color={color}>{label}</Badge>;
        },
      },
      {
        accessorKey: 'error',
        id: 'error',
        header: 'Error',
        enableSorting: false,
        Cell: ({ cell }) => {
          const error = cell.getValue<string>();
          return <Text>{error ?? '-'}</Text>;
        },
      },
      {
        accessorKey: 'topicId',
        id: 'topicId',
        header: 'Topic ID',
      },
      {
        accessorKey: 'transactionId',
        header: 'Transaction ID',
        enableSorting: false,
        Cell: ({ row }) => {
          const value = row?.original?.transactionId;
          const url = row?.original?.url;

          return <Link value={value} url={url} />;
        },
      },
      {
        accessorKey: 'createdAt',
        id: 'createdAt',
        header: 'Created Date',
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
    data,
    initialState: { density: 'xs' },
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Consensus Messages</h1>
      </div>
      <div className={styles.tableHeader}>
        <Select
          style={{ width: '200px', marginBottom: '20px' }}
          label="Status"
          value={status}
          onChange={(value) => {
            if (value !== null) {
              setStatus(value);
            }
          }}
          data={statusFilters}
        />
        <Button onClick={open}>Create Message</Button>
      </div>

      <MantineReactTable table={table} />

      <CreateMessage opened={opened} onClose={close} onSuccess={refetch} />
    </div>
  );
};

export default DocMgtAudits;
