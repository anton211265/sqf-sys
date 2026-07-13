import React, { useEffect, useMemo, useState } from 'react';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import 'mantine-react-table/styles.css';
import { MRT_Row, type MRT_ColumnDef } from 'mantine-react-table';
import MantineTable from 'components/Table/MantineTable';
import axios from 'axios';
import { BASE_URL } from 'constants/constant';
import { notifications } from '@mantine/notifications';
import { ActionIcon, Badge } from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import { color } from 'constants/color';
import { useNavigate } from 'react-router-dom';
import { ADMIN } from 'constants/routes';

const OrganizationList = () => {
  const [orgData, setOrgData] = useState<any[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrgData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/trade-directory/api/organizations`
        );
        const fetchedOrganizationsData = response.data;

        console.log(
          '🚀 ~ fetchedOrganizationsData ~ :',
          fetchedOrganizationsData
        );

        setOrgData(fetchedOrganizationsData.data); // Update state with fetched org data
      } catch (error) {
        console.error('Error fetching organizations:', error);

        // Show error notification (with "once" to prevent duplication)
        notifications.show({
          id: 'fetch-error', // Unique ID to ensure it displays only once
          title: 'Error',
          message: 'Failed to fetched organizations data',
          color: 'red',
          autoClose: 2000,
        });
      }
    };

    fetchOrgData();
  }, []);

  // Map persona to badge color
  const personaColors: { [key: string]: string } = {
    BORROWER: 'blue',
    SUPPLIER: 'green',
    INVESTOR: 'yellow',
  };

  const columns: MRT_ColumnDef<any>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'Organization ID',
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase', // Converts header text to lowercase
            fontSize: '13px',
            color: color.DARKGREY,
          },
        },
        mantineFilterTextInputProps: {
          placeholder: 'Search by Organization ID', // Custom placeholder
        },
        enableHiding: false,
      },
      {
        accessorKey: 'organizationName',
        header: 'Organization Name',
        enableHiding: false,
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase', // Converts header text to lowercase
            fontSize: '13px',
            color: color.DARKGREY,
          },
        },
        size: 400,
        mantineFilterTextInputProps: {
          placeholder: 'Search by Organization Name', // Custom placeholder
        },
        Cell: ({ cell }) => (
          <span>{cell.getValue<string>().toUpperCase()}</span>
        ), // Render the country data in uppercase
      },
      {
        accessorKey: 'persona',
        header: 'Persona',
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase', // Converts header text to lowercase
            fontSize: '13px',
            color: color.DARKGREY,
          },
        },
        size: 280,
        filterVariant: 'select', // Use a dropdown for filtering
        mantineFilterSelectProps: {
          data: ['Borrower', 'Supplier', 'Investor'], // Options for the dropdown
          placeholder: 'Search by Persona', // Custom placeholder
        },
        enableHiding: false,
        enableSorting: false,
        Cell: ({ row }) => {
          const personas = row.original.applicationPersonas || []; // Safely access personas array
          return personas.length === 0 ||
            personas.every((persona: string) => persona === null) ? ( // Check if no personas are available
            <span style={{ color: 'black' }}> &#8211;</span>
          ) : (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {personas
                .filter((persona: string) => persona !== null)
                .map((persona: string) => (
                  <Badge
                    key={persona}
                    color={personaColors[persona]} // Fallback color for unknown personas
                    variant="light"
                    size="sm"
                  >
                    {persona}
                  </Badge>
                ))}
            </div>
          );
        },
        filterFn: (row, id, value) => {
          const { applicationPersonas } = row.original;

          // Check if applicationPersonas is an array and contains the filter value
          return (
            Array.isArray(applicationPersonas) &&
            applicationPersonas.includes(value.toUpperCase())
          );
        },
      },
      {
        accessorKey: 'country',
        header: 'Country',
        enableHiding: false,
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase',
            fontSize: '13px',
            color: color.DARKGREY,
          },
        },
        size: 200,
        mantineFilterTextInputProps: {
          placeholder: 'Search by Country', // Custom placeholder
        },
        Cell: ({ cell }) => (
          <span>{cell.getValue<string>().toUpperCase()}</span>
        ), // Render the country data in uppercase
      },
      {
        accessorKey: 'emailAddress',
        header: 'Email Address',
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase', // Converts header text to lowercase
            fontSize: '13px',
            color: color.DARKGREY,
          },
        },
        size: 250,
        mantineFilterTextInputProps: {
          placeholder: 'Search by Email Address', // Custom placeholder
        },
        enableHiding: false,
        Cell: ({ row }) => {
          const emailAddress = row.original.emailAddress;
          return emailAddress ? emailAddress : '-'; // Display emailAddress or dash if null
        },
      },
      {
        accessorKey: 'contactNumber',
        header: 'Contact Number',
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase', // Converts header text to lowercase
            fontSize: '13px',
            color: color.DARKGREY,
          },
        },
        size: 200,
        mantineFilterTextInputProps: {
          placeholder: 'Search by Contact Number', // Custom placeholder
        },
        enableHiding: false,
        Cell: ({ row }) => {
          const contactNumber = row.original.contactNumber;
          return contactNumber ? contactNumber : '-'; // Display contactNumber or dash if null
        },
      },
      {
        accessorKey: 'action',
        header: 'Action',
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase', // Converts header text to lowercase
            fontSize: '13px',
            color: color.DARKGREY,
          },
        },
        size: 150,
        enableColumnFilter: false,
        enableSorting: false,
        enableHiding: false,
        Cell: ({ row }) => (
          <div>
            <ActionIcon
              variant="filled"
              aria-label="Settings"
              radius="xl"
              onClick={() => viewOrganizationClick(row)}
            >
              <IconEye size={16} stroke={1.5} />
            </ActionIcon>
          </div>
        ),
      },
    ],
    []
  );

  const viewOrganizationClick = async (row: MRT_Row<any>) => {
    const rowId = row.original.id; // Access the row's ID or any unique identifier

    // Redirect to the view page with the row ID
    navigate(
      ADMIN.ORGANIZATIONVIEW.replace(':organizationId', row.original.id)
    );
  };

  return (
    <div className="min-h-screen flex flex-col pb-14 px-[5%]">
      <div className="pt-14 pb-9">
        <h1 className="font-bold text-xl ">Trade Directory</h1>
      </div>
      <div className="border bg-white border-zinc-300 rounded-lg">
        <MantineTable
          data={orgData}
          columns={columns}
          searchPlaceholder="Search organization"
        />
      </div>
    </div>
  );
};

export default OrganizationList;
