import { Grid, Text } from '@mantine/core';
import React from 'react';
import { FC, ReactNode } from 'react';

interface IProps {
  label: string;
  value: ReactNode;
  error?: boolean;
}

const ItemRow: FC<IProps> = ({ label, value, error }) => {
  return (
    <Grid align="center" columns={24}>
      <Grid.Col span="content">
        <Text c="dimmed">{label}</Text>
      </Grid.Col>
      <Grid.Col span="auto">
        <Text>{value}</Text>
      </Grid.Col>
    </Grid>
  );
};

export default ItemRow;
