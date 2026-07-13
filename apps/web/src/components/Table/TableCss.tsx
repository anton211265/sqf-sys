import { createStyles } from "@mantine/styles";

export const useStyles = createStyles(() => ({
  csvTable: {
    borderCollapse: "collapse",
    width: "100%",
    marginTop: 20,
  },

  th: {
    color: "#343a40",
    fontSize: 14,
    fontStyle: "normal",
    fontWeight: 700,
    lineHeight: "14.889px",
    padding: "10px 20px",
    borderBottom: "2px solid #dfdfdf",
    cursor: "pointer",
    // display: "flex",
    // flexDirection: "column",
    // justifyContent:"s"
  },

  td: {
    paddingLeft: 20,
    borderBottom: "0.6px solid #dfdfdf",
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 13,
    color: "#6c757d",
    fontWeight: 400,
  },

  tr: {
    borderBottom: "1px solid #dfdfdf",
  },

  rowCheckbox: {
    paddingLeft: 20,
    paddingRight: 20,
  },

  icons: {
    display: "inline-flex",
    flexDirection: "column",
    marginLeft: 65,
    marginBottom: -5,
    position: "relative",
    bottom: 5,
  },

  sortableHeader: {
    display: "flex",
    width: "100%",
    justifyContent: "space-evenly",
  },

  header: {
    flexWrap: "nowrap",
    textAlign: "left",
    width: "max-content",
  },
}));
