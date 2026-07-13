import React, { ReactNode, useState } from 'react';
import {
  useMantineReactTable,
  MRT_ColumnDef,
  MRT_GlobalFilterTextInput,
  MRT_ToggleFiltersButton,
  MRT_TableContainer,
  MRT_TablePagination,
  MRT_ToolbarAlertBanner,
  MRT_Row,
} from 'mantine-react-table';
import { Box, Flex } from '@mantine/core';
import {
  IconFilter,
  IconFilterOff,
  IconSearch,
  TablerIconsProps,
} from '@tabler/icons-react';
import { color } from 'constants/color';

// Define a generic type for the data
type DataType = Record<string, any>;

type MantineTableProps<T extends DataType> = {
  columns: MRT_ColumnDef<T>[];
  data: T[];
  action?: ReactNode;
  // fetchData: (
  //   pageNumber: number,
  //   pageSize: number
  // ) => Promise<{ data: T[]; totalCount: number }> | Promise<void>;
  onRowClick?: (row: MRT_Row<T>) => Promise<void>;
  enableRowClick?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  enableStickyHeader?: boolean;
  maxHeight?: string;
};

const MantineTable = <T extends DataType>({
  columns,
  data,
  action,
  // fetchData,
  enableRowClick = false,
  onRowClick,
  searchPlaceholder = 'Search',
  pageSize = 10,
  enableStickyHeader = false,
  maxHeight = 'none', // Default to 'none' if not provided
}: MantineTableProps<T>) => {
  // const [data, setData] = useState<T[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({
    pageIndex: 1,
    pageSize: 5, //customize the default page size
  });
  // useEffect(() => {
  //   fetchData(pagination.pageIndex, pagination.pageSize).then((response) => {
  //     console.log(response);

  //     if (response && 'data' in response && 'totalCount' in response) {
  //       setData(response.data);
  //       setTotalCount(response.totalCount);
  //     }
  //   });
  // }, [pagination.pageIndex, pagination.pageSize]);
  // }, [fetchData, pagination.pageIndex, pagination.pageSize]);

  const table = useMantineReactTable({
    columns,
    data,
    enableFullScreenToggle: false,
    enableDensityToggle: false,
    enableStickyHeader: enableStickyHeader,
    mantineTableContainerProps: {
      style: { maxHeight: enableStickyHeader ? maxHeight : 'none' },
    },
    initialState: {
      showGlobalFilter: true,
      pagination: {
        pageSize: pageSize, // Use dynamic pageSize from props
        pageIndex: 0, // Default to the first page
      },
    },
    icons: {
      // Use a smaller filter icon (IconAdjustments) for the filter functionality
      IconFilter: (props: React.JSX.IntrinsicAttributes & TablerIconsProps) => (
        <IconFilter {...props} size={18} />
      ),
      IconFilterOff: (
        props: React.JSX.IntrinsicAttributes & TablerIconsProps
      ) => <IconFilterOff {...props} size={18} />,

      // Use a smaller search icon (IconSearch) for the global search functionality
      IconSearch: (props: React.JSX.IntrinsicAttributes & TablerIconsProps) => (
        <IconSearch {...props} size={18} />
      ),
    },
    mantinePaperProps: {
      style: { border: 'none', width: 'auto', boxShadow: 'none' },
    },
    mantineTableHeadCellProps: {
      style: {
        fontSize: '13px', // Set font size for the table header text
        color: '#565D6D', // Set header text color
        backgroundColor: '#FAFAFB', // Set header background color
      },
    },
    defaultColumn: {
      size: 20,
    },
    mantinePaginationProps: {
      withEdges: true,
      showRowsPerPage: false,
      color: color.GRAPE,
      size: 'sm', // For arrow icon size in pagination
    },
    paginationDisplayMode: 'pages',

    // Made onRowClick optional, only triggered if enableRowClick is true and onRowClick is provided
    mantineTableBodyRowProps: ({ row }) => ({
      onClick: (event) => {
        const target = event.target as Element;
        if (enableRowClick && target.tagName === 'TD' && onRowClick) {
          onRowClick(row);
        }
      },
      style: {
        cursor: enableRowClick ? 'pointer' : 'default',
        fontSize: '12px',
      },
    }),
    mantineSearchTextInputProps: {
      styles: (theme) => ({
        input: {
          paddingLeft: '45px', // Adjust padding for the smaller icon
          fontSize: '13px', // Adjust the input text font size
        },
        icon: {
          fontSize: '14px', // Set the size of the search icon
        },
      }),
    },
  });

  return (
    <Box>
      <Flex
        style={{
          borderRadius: '4px',
          flexDirection: 'row',
          gap: '16px',
          justifyContent: 'flex-end',
          padding: '16px',
        }}
      >
        {action && <Box>{action}</Box>}

        <div
          className="flex flex-1"
          style={{
            display: 'flex',
            justifyContent: action ? 'flex-end' : 'space-between', // Adjust alignment of action button and (search + filter) dynamically
            width: '100%',
            alignItems: 'center',
          }}
        >
          {
            <MRT_GlobalFilterTextInput
              table={table}
              placeholder={searchPlaceholder ? searchPlaceholder : 'Search'}
              style={{ flex: '1', maxWidth: '300px' }}
            />
          }
          {
            <MRT_ToggleFiltersButton
              table={table}
              style={{
                fontSize: '12px', // Smaller font size for the button
                padding: '4px', // Compact padding
              }}
            />
          }
        </div>
      </Flex>
      <MRT_TableContainer table={table} />
      <Box>
        <div className="flex justify-center p-2">
          <MRT_TablePagination table={table} />
        </div>
        <Box style={{ display: 'grid', width: '100%' }}>
          <MRT_ToolbarAlertBanner stackAlertBanner table={table} />
        </Box>
      </Box>
    </Box>
  );
};

export default MantineTable;
