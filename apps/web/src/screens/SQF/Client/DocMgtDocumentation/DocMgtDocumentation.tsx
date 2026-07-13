import React, { FC } from 'react';
import styles from './DocMgtDocumentation.module.css';
import { Paper, Space } from '@mantine/core';
import TableOfContents from './Components/TableOfContents';
import GeneralInfo from './Components/GeneralInfo';
import ApiEndpoints from './Components/ApiEndpoints';
import Webhook from './Components/Webhook';

const DocMgtDcoumentation: FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Documentation</h1>
      </div>

      <Paper shadow="sm" p="lg" withBorder>
        <TableOfContents />
        <Space h="xl" />

        <GeneralInfo />
        <Space h="xl" />

        <ApiEndpoints />
        <Space h="xl" />

        <Webhook />
      </Paper>
    </div>
  );
};

export default DocMgtDcoumentation;
