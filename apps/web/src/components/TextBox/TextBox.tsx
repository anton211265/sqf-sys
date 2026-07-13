import React, { FC, CSSProperties, forwardRef } from 'react';
import { TextInput as MantineTextInput, TextInputProps } from '@mantine/core';
import '@mantine/core/styles.css';
// import { MantineTheme, useMantineTheme } from '@mantine/styles';

type Props = {
  inputStyles?: CSSProperties;
  style?: CSSProperties; // Accept custom styles from parent
  required?: boolean;
  labelStyles?: CSSProperties;
  size?: string;
  text?: boolean;
} & TextInputProps;

const TextInput: FC<Props> = forwardRef<HTMLInputElement, Props>(
  (
    { style, inputStyles, required, labelStyles, size, text, ...props },
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
      <MantineTextInput
        ref={ref}
        style={{
          ...style,
        }}
        {...props}
        styles={{
          input: text ? textStyles : inputStyles,
          label: { fontWeight: labelStyles?.fontWeight ?? 250 },
        }}
        size={size ?? 'xs'}
        withAsterisk={required}
        required={required}
      />
    );
  }
);

export default TextInput;
