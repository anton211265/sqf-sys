// Button.tsx
import React, { FC, ReactNode, CSSProperties } from 'react';
import { createStyles } from '@mantine/styles';
import { Button as MantineButton } from '@mantine/core';
import '@mantine/core/styles.css';

const useStyles = createStyles(() => ({
  buttonClass: {
    display: 'inline-flex',
    // padding: '11px 52px',
    padding: '0px',
    alignItems: 'center',
    gap: '24px',
    borderRadius: '8px',
    fontSize: '16px',
    justifyContent: 'center',
    fontWeight: 700,
    color: '#000000',
  },
  // Additional styles for different variants
  primary: {
    border: '1px solid #04174B',
    background: '#04174B',
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

type Variant = 'primary' | 'secondary' | 'tertiary' | 'custom' | 'nav';

type Props = {
  fontSize?: string;
  justifyContent?: string;
  alignItems?: string;
  textColor?: string;
  backgroundColor?: string;
  children?: ReactNode;
  width?: string;
  border?: string;
  onClick: CallableFunction;
  variant?: Variant;
  style?: CSSProperties; // Accept custom styles from parent
  iconStyle?: CSSProperties; // Accept custom styles for the icon
} & Record<string, any>;

const Button: FC<Props> = ({
  onClick,
  children,
  variant = 'primary',
  style, // Use the 'style' prop from parent
  ...props
}) => {
  const { classes } = useStyles();

  // Create a new object with only the relevant properties
  const variantStyles: Record<Variant, string> = {
    primary: classes.primary,
    secondary: classes.secondary,
    tertiary: classes.tertiary,
    custom: '',
    nav: classes.nav,
  };

  const variantClass = variantStyles[variant] || classes.primary;

  return (
    <MantineButton
      onClick={() => onClick()}
      className={`${classes.buttonClass} ${variantClass}`}
      style={{
        ...style,
        cursor: 'pointer',
        color: style?.color,
        backgroundColor: style?.backgroundColor,
        width: style?.width,
        border: style?.border,
        borderRadius: style?.borderRadius,
        fontSize: style?.fontSize,
        fontStyle: 'normal',
        fontWeight: style?.fontWeight,
        lineHeight: 'normal',
        display: 'flex',
        justifyContent: style?.justifyContent,
        alignItems: style?.alignItems,
        padding: style?.padding,
      }}
      {...props}
      styles={{
        section: { display: 'flex', alignItems: 'center' },
        inner: { display: 'flex', alignItems: 'center' },
        label: {
          marginLeft: props.leftSection ? '10px' : '0px',
          fontSize: style?.fontSize,
          color: style?.color ?? '#000000',
        },
      }}
    >
      {children}
    </MantineButton>
  );
};

export default Button;
