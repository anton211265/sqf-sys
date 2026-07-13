import { createStyles } from '@mantine/styles';

export const useStyles = createStyles(() => ({
  chipClass: {
    // display: 'inline-flex',
    // padding: '11px 24px', // Adjusted padding
    // alignItems: 'center',
    // gap: '24px',
    // borderRadius: '8px',
    // fontSize: '16px',
    // justifyContent: 'center',
    // fontWeight: 700,
    // color: '#000000',
  },
  // Additional styles for different variants
  primary: {
    // border: '1px solid #04174B',
    // background: '#04174B',
  },
  secondary: {
    border: '1px solid rgba(4, 23, 75, 0.20)',
    background: '#FFF',
  },
  tertiary: {
    border: '1px solid rgba(4, 23, 75, 0.20)',
    background: 'rgba(77, 92, 146, 0.80)',
    boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.25)',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'none',
    border: '1px solid',
    color: '#fff',
    fontWeight: 400,
    fontSize: '12px',
  },
}));
