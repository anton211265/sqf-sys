import React, { FC, ReactNode, useState } from 'react';
import {
  Chip as MantineChip,
  //   useMantineTheme,
  //   getGradient,
} from '@mantine/core';
import '@mantine/core/styles.css';
// import { lighten } from '@mantine/core';

type Props = {
  isGradient?: boolean; // New prop for gradient color
  color: string; // Use Mantine's color prop
  variant: string;
  readOnly?: boolean; // Use readOnly instead of disabled
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  icon?: ReactNode | boolean;
} & Record<string, any>;

const Chip: FC<Props> = ({
  children,
  isGradient,
  color,
  readOnly = false,
  checked = false,
  onChange,
  icon,
  ...props
}) => {
  //   const theme = useMantineTheme();

  const [isChecked, setIsChecked] = useState(checked);

  const handleClick = () => {
    if (!readOnly) {
      const newCheckedState = !isChecked;
      setIsChecked(newCheckedState);

      if (onChange) {
        onChange(newCheckedState);
      }
    }
  };

  return (
    <MantineChip
      autoContrast
      {...props}
      color={
        isGradient
          ? //   ? getGradient({ deg: 180, from: color, to: '#fff' }, theme)
            color
          : color
      }
      variant={props.variant}
      readOnly={readOnly}
      checked={isChecked}
      onClick={handleClick}
      icon={icon ? icon : <></>}
      style={{ cursor: readOnly ? 'default' : 'pointer' }}
    >
      {icon ? children : <div style={{ marginLeft: '-20px' }}>{children}</div>}
    </MantineChip>
  );
};

export default Chip;
