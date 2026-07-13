import React, { FC, CSSProperties, forwardRef } from 'react';
import {
  TextInput as MantineTextInput,
  NumberInput as MantineNumberInput,
  NumberInputProps,
} from '@mantine/core';
import '@mantine/core/styles.css';

type Props = {
  inputStyles?: CSSProperties;
  style?: CSSProperties; // Accept custom styles from parent
  required?: boolean;
  labelStyles?: CSSProperties;
  size?: string;
  text?: boolean;
  isPhoneNumber?: boolean;
} & Omit<NumberInputProps, 'styles'>;

const NumberInput: FC<Props> = forwardRef<HTMLInputElement, Props>(
  (
    {
      style,
      inputStyles,
      required,
      labelStyles,
      size,
      text,
      isPhoneNumber,
      ...props
    },
    ref
  ) => {
    const textStyles = {
      border: 'none',
      padding: 0,
      fontWeight: 600,
      marginTop: -5,
      textOverflow: 'visible',
      whiteSpace: 'nowrap',
      overflow: 'visible',
    };

    return (
      <MantineNumberInput
        allowNegative={false}
        hideControls
        decimalScale={!isPhoneNumber ? 2 : 0}
        thousandSeparator={!isPhoneNumber ? ',' : ''}
        fixedDecimalScale={!isPhoneNumber}
        ref={ref}
        style={{
          ...style,
        }}
        {...props}
        styles={{
          input: text ? textStyles : inputStyles,
          label: { fontWeight: labelStyles?.fontWeight ?? 250 },
          root: { ...style },
        }}
        size={size ?? 'xs'}
        withAsterisk={required}
        required={required}
      />
    );
  }
);

export default NumberInput;
