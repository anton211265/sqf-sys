import React, { useEffect, useState } from "react";
import { useStyles } from "./TableCss";

const CustomTable = ({ data, columnHeadings }: any) => {
  console.log("🚀 ~ CustomTable ~ data:", data)
  const { classes } = useStyles();
//   const [selectedRows, setSelectedRows] = useState(new Set<number>());
  const [sortDirection, setSortDirection] = useState<string | null>(null);
  const [sortedData, setSortedData] = useState([...data]);

  const handleSort = (columnName:string|number) => {
  let newSortDirection = "asc";
  if (sortDirection === "asc") {
    newSortDirection = "desc";
  }

  const sorted = sortedData.slice().sort((a, b) => {
    const valueA = a[columnName];
    const valueB = b[columnName];

    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return newSortDirection === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
    } else {
      // Handle other types of data (e.g., numbers, dates)
      return newSortDirection === "asc" ? valueA - valueB : valueB - valueA;
    }
  });

  setSortDirection(newSortDirection);
  setSortedData(sorted);
};


  useEffect(() => {
    setSortedData([...data]);
  }, [data]);

  return (
    <table className={classes.csvTable}>
      <thead>
        <tr className={classes.tr}>
         
          {columnHeadings.map((heading: string, index: number) => (
            <th
              key={index}
              className={classes.th}
              onClick={() => handleSort(heading)}
            >
              <div className={classes.sortableHeader}>
                <span className={classes.header}>{heading}</span>
                <div className={classes.icons}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 9 9"
                    fill="none"
                  >
                    <path
                      d="M6.81171 6.2168H1.60281C1.44657 6.2168 1.35933 6.05184 1.45609 5.93922L4.06054 2.9192C4.13509 2.83276 4.27863 2.83276 4.35398 2.9192L6.95843 5.93922C7.05518 6.05184 6.96794 6.2168 6.81171 6.2168Z"
                      fill="#343A40"
                    />
                  </svg>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 9 9"
                    fill="none"
                  >
                    <path
                      d="M4.20726 5.57069L1.95535 2.95947H6.45916L4.20726 5.57069Z"
                      fill="#EAEAEA"
                      stroke="#EAEAEA"
                      stroke-width="0.676755"
                    />
                  </svg>
                </div>
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedData.map((row: any, index: number) => (
          <tr className={classes.tr} key={index}>
           
            {columnHeadings.map((heading: string, colIndex: number) => (
              <td key={colIndex} className={classes.td}>
                {row[heading]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CustomTable;
