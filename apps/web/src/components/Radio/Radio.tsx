import React, { FC, CSSProperties, forwardRef } from 'react';
import {
  Group,
  Radio as MantineRadio,
  MantineSize,
  RadioGroupProps,
} from '@mantine/core';
import '@mantine/core/styles.css';

type RadioOption = {
  value: string;
  label: string;
};

type Props = {
  style?: CSSProperties;
  required?: boolean;
  labelStyles?: CSSProperties;
  size: MantineSize | undefined;
  name: string;
  label: string;
  className?: string;
  radio: RadioOption[];
  radioStyle?: CSSProperties;
} & RadioGroupProps;

const Radio: FC<Props> = forwardRef<HTMLInputElement, Props>(
  (
    {
      style,
      required,
      size,
      name,
      label,
      className,
      radio,
      children,
      radioStyle,
      ...props
    },
    ref
  ) => {
    return (
      <MantineRadio.Group
        name={name}
        label={label}
        className={`flex items-center justify-start gap-5 mt-5 ${className}`}
        style={style}
        required={required}
        size={size}
        ref={ref}
        styles={{ label: { fontWeight: 250, minWidth: 160 } }}
        {...props}
      >
        <Group className="flex items-center">
          {radio.map((item) => (
            <MantineRadio
              width={200}
              key={item.value}
              value={item.value}
              label={item.label}
              style={{ width: radioStyle?.width ?? '150px' }} // Adjust the width here
            />
          ))}
        </Group>
      </MantineRadio.Group>
    );
  }
);

export default Radio;
