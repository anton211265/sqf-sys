import React, { FC } from 'react';
import { Anchor, Space, Stack, Title } from '@mantine/core';

const TableOfContents: FC = () => {
  return (
    <>
      <Title order={4}>Table of Contents</Title>
      <Space h="md" />
      <Stack gap={4} ml="md">
        <Anchor href="#general-info">1. General Info</Anchor>
        <Stack gap={2} ml="lg">
          <Anchor href="#base-url">1.1 Base URL</Anchor>
          <Anchor href="#authentication">1.2 Authentication</Anchor>
          <Anchor href="#limits">1.3 Limits</Anchor>
        </Stack>

        <Anchor href="#api-endpoints">2. API Endpoints</Anchor>
        <Stack gap={2} ml="lg">
          <Anchor href="#consensus-messaging">2.1 Consensus Messaging</Anchor>
          <Anchor href="#extraction">2.2 Extraction</Anchor>
        </Stack>

        <Anchor href="#webhook">3. Webhook</Anchor>
        <Stack gap={2} ml="lg">
          <Anchor href="#consensus-messaging-webhook">
            3.1 Consensus Messaging Webhook Example
          </Anchor>
          <Anchor href="#document-extraction-webhook">
            3.2 Document Extraction Webhook Example
          </Anchor>
        </Stack>
      </Stack>
    </>
  );
};

export default TableOfContents;
