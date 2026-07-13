import { Anchor } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import { FC } from 'react';
import styles from './Link.module.css';
import React from 'react';

interface IProps {
  value: string;
  url: string;
}

const Link: FC<IProps> = ({ value, url }) => {
  return (
    <Anchor
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.link}
    >
      {value}
      <IconExternalLink size={16} stroke={1.5} />
    </Anchor>
  );
};

export default Link;
