import { ActionIcon, Badge, Button, Select, Space, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import CopyIcon from 'components/CopyButton/CopyButton';
import { EXTRACTION_STATUS_LABELS } from 'constants/documentExtraction';
import { DocumentExtractionStatus, LLMProvider } from 'constants/enum';
import useGetExtractions from 'hooks/useGetExtractions';
import {
  MantineReactTable,
  MRT_ColumnDef,
  useMantineReactTable,
} from 'mantine-react-table';
import React, { FC, useMemo, useState } from 'react';
import { IGetExtractionsResponse } from 'service/getExtractions';
import { convertDate } from 'utils/date';
import styles from './DocMgtExtractions.module.css';
import { LLM_LABELS } from 'constants/llm';
import { JsonView } from 'react-json-view-lite';
import { downloadFile } from 'service/file';
import { IconDownload } from '@tabler/icons-react';
import useDownloadExtractionDocument from 'hooks/useDownloadDocument';
import { useDisclosure } from '@mantine/hooks';
import UploadDocExtraction from './Components/Upload';

const DocMgtExtractions: FC = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const noStatusFilter = 'ALL';
  const [status, setStatus] = useState(noStatusFilter);
  const statusFilters = [
    noStatusFilter,
    DocumentExtractionStatus.PENDING_REVIEW.toUpperCase(),
    DocumentExtractionStatus.PENDING_LLM_EXTRACTION.toUpperCase(),
    DocumentExtractionStatus.PENDING_WEBHOOK.toUpperCase(),
    DocumentExtractionStatus.PARTIAL_COMPLETED.toUpperCase(),
    DocumentExtractionStatus.COMPLETED.toUpperCase(),
    DocumentExtractionStatus.FAILED.toUpperCase(),
  ];
  const {
    data = [],
    error,
    isLoading,
    refetch,
  } = useGetExtractions(status !== noStatusFilter ? status.toLowerCase() : '');
  const downloadDocumentMutation = useDownloadExtractionDocument();

  if (error) {
    notifications.show({
      id: 'error',
      title: 'Error',
      message: (error as Error).message,
      color: 'red',
      autoClose: 2000,
    });
  }

  const columns = useMemo<MRT_ColumnDef<IGetExtractionsResponse>[]>(
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
        accessorKey: 'fileName',
        id: 'fileName',
        header: 'File Name',
      },
      {
        accessorKey: 'refId',
        id: 'refId',
        header: 'Ref ID',
      },
      {
        accessorKey: 'documentType',
        id: 'documentType',
        header: 'Document Type',
      },
      {
        accessorKey: 'templateId',
        id: 'templateId',
        header: 'Template ID',
      },
      {
        accessorKey: 'status',
        id: 'status',
        header: 'Status',
        enableSorting: false,
        Cell: ({ cell }) => {
          const status = cell.getValue<DocumentExtractionStatus>();
          const label = EXTRACTION_STATUS_LABELS[status];

          const color =
            status === DocumentExtractionStatus.COMPLETED
              ? 'green'
              : status === DocumentExtractionStatus.FAILED
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
        accessorKey: 'tokens',
        id: 'tokens',
        header: 'Tokens Used',
      },
      {
        accessorKey: 'pages',
        id: 'pages',
        header: 'Pages',
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
          return (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <ActionIcon
                disabled={downloadDocumentMutation.isLoading}
                onClick={() =>
                  handleDownload(row.original.fileName, row.original.requestId)
                }
              >
                <IconDownload size={16} />
              </ActionIcon>
            </div>
          );
        },
      },
    ],
    []
  );

  const handleDownload = (fileName: string, requestId: string) => {
    downloadDocumentMutation.mutate(
      { requestId },
      {
        onSuccess: (data: Blob) => {
          downloadFile(data, fileName);
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
        <Text>Extracted Data:</Text>
        <Space h="sm" />
        {row.original.extractedData ? (
          <JsonView data={row.original.extractedData} />
        ) : (
          <Text c="dimmed" fs="italic">
            Pending data extraction
          </Text>
        )}
      </div>
    ),
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Extractions</h1>
      </div>
      <div className={styles.tableHeader}>
        <Select
          style={{ width: '250px', marginBottom: '20px' }}
          label="Status"
          value={status}
          onChange={(value) => {
            if (value !== null) {
              setStatus(value);
            }
          }}
          data={statusFilters}
        />
        <Button onClick={open}>Upload</Button>
      </div>

      <MantineReactTable table={table} />

      <UploadDocExtraction
        opened={opened}
        onClose={close}
        onSuccess={refetch}
      />
    </div>
  );
};

export default DocMgtExtractions;
