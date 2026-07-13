import { Text, Title } from '@mantine/core';
import { type MRT_ColumnDef, MRT_Row } from 'mantine-react-table';
import MantineTable from 'components/Table/MantineTable';
import { TRADE_DIRECTORY } from 'constants/routes';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IDirectoryOrganization } from 'service/tradeDirectory';
import { useDirectoryOrganizations } from 'hooks/useTradeDirectory';
import { PersonaBadges } from './components/Badges';

const DirectoryHome: React.FC = () => {
  const navigate = useNavigate();
  const { data: organizations = [], isLoading } = useDirectoryOrganizations();

  const columns = useMemo<MRT_ColumnDef<IDirectoryOrganization>[]>(
    () => [
      {
        accessorKey: 'organizationName',
        header: 'Organisation',
      },
      {
        accessorKey: 'businessRegistrationNumber',
        header: 'Reg. No.',
        Cell: ({ cell }) => cell.getValue<string>() ?? '—',
      },
      {
        accessorKey: 'country',
        header: 'Country',
      },
      {
        id: 'personas',
        header: 'Personas',
        enableColumnFilter: false,
        accessorFn: (row) =>
          [
            row.personas.isFunder && 'Funder',
            row.personas.isClient && 'Client',
            row.personas.isSupplier && 'Supplier',
            row.personas.isBuyer && 'Buyer',
          ]
            .filter(Boolean)
            .join(', '),
        Cell: ({ row }) => <PersonaBadges personas={row.original.personas} />,
      },
      {
        accessorKey: 'emailAddress',
        header: 'Email',
        Cell: ({ cell }) => cell.getValue<string>() ?? '—',
      },
      {
        id: 'onboarded',
        header: 'Onboarded',
        accessorFn: (row) => (row.fullyOnboardedAt ? 'Yes' : 'No'),
      },
    ],
    [],
  );

  const handleRowClick = async (row: MRT_Row<IDirectoryOrganization>) => {
    navigate(
      TRADE_DIRECTORY.ORGANIZATION.replace(
        ':organizationId',
        String(row.original.id),
      ),
    );
  };

  return (
    <div className="p-6">
      <Title order={2} mb={4}>
        Trade Directory
      </Title>
      <Text c="dimmed" size="sm" mb="md">
        Every organisation in the funder&apos;s network, with the personas it
        holds. Select an organisation to see its relationships, contracts and
        invoices.
      </Text>
      <MantineTable
        columns={columns}
        data={organizations}
        enableRowClick
        onRowClick={handleRowClick}
        searchPlaceholder="Search organisations"
        pageSize={15}
      />
      {isLoading && <Text size="sm">Loading…</Text>}
    </div>
  );
};

export default DirectoryHome;
