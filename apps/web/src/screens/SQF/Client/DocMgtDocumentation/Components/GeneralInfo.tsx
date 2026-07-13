import React, { FC } from 'react';
import { Anchor, Space, Stack, Title, Text, Code } from '@mantine/core';
import styles from '../DocMgtDocumentation.module.css';
import { BASE_URL } from 'constants/constant';
import { CLIENT_DASHBOARD } from 'constants/routes';
import { Link } from 'react-router-dom';

const GeneralInfo: FC = () => {
  return (
    <>
      <Title id="general-info" order={4}>
        1. General Info
      </Title>
      <Space h="md" />

      <div className={styles.subContent}>
        <Title id="base-url" order={5}>
          1.1 Base URL
        </Title>
        <Space h="md" />
        <div className={styles.subContent}>
          <Text>All requests are made to the following base URL:</Text>
          <Code block mt="sm">
            {BASE_URL}
          </Code>
          <Text mt="xs">
            Make sure to prefix all endpoints with this base URL when making
            requests.
          </Text>
        </div>
        <Space h="xl" />

        <Title id="authentication" order={5}>
          1.2 Authentication
        </Title>
        <Space h="md" />
        <div className={styles.subContent}>
          <Text>
            All API endpoints require the following header for authentication:
          </Text>
          <Code block mt="sm">
            api-key: YOUR_API_KEY
          </Code>
          <Space h="sm" />
          <ul>
            <li>
              <Text>
                You can generate and manage your API keys in the dashboard under
                the{' '}
                <Anchor component={Link} to={CLIENT_DASHBOARD.DOC_MGT_API_KEY}>
                  API Keys
                </Anchor>{' '}
                section.
              </Text>
            </li>
            <li>
              <Text c="red">
                Requests without a valid api-key will return a 401 Unauthorized
                response.
              </Text>
            </li>
          </ul>
        </div>
        <Space h="xl" />

        <Title id="limits" order={5}>
          1.3 Limits
        </Title>
        <Space h="md" />
        <div className={styles.subContent}>
          <Stack gap="sm">
            <Text>
              <strong>Rate Limits</strong>: All endpoints allow up to 100
              requests every 60 seconds. Exceeding these limits returns HTTP 429
              (Too Many Requests).
            </Text>
            <Text>
              <strong>File-size Limits</strong>: The maximum payload size is 100
              MB.
            </Text>
          </Stack>
        </div>
      </div>
    </>
  );
};

export default GeneralInfo;
