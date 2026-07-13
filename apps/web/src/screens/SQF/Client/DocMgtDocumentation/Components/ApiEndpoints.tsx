import React, { FC } from 'react';
import { Anchor, Space, Stack, Title, Text } from '@mantine/core';
import styles from '../DocMgtDocumentation.module.css';
import { CLIENT_DASHBOARD } from 'constants/routes';
import { Link } from 'react-router-dom';

const ApiEndpoints: FC = () => {
  return (
    <>
      <Title id="api-endpoints" order={4}>
        2. API Endpoints
      </Title>
      <Space h="md" />
      <div className={styles.subContent}>
        <Title id="consensus-messaging" order={5}>
          2.1 Consensus Messaging
        </Title>
        <Space h="md" />
        <div className={styles.subContent}>
          <Stack gap="sm">
            <Text>
              Interact with Hedera Consensus Service (HCS) to create topics and
              submit messages. A topic in Hedera represents a channel where
              messages can be appended in order. Each message is an immutable
              entry recorded on the blockchain under that topic and is
              permanently stored on-chain.
            </Text>

            <Text>
              <Anchor
                component={Link}
                to={`${CLIENT_DASHBOARD.DOC_MGT_REFERENCE}#/Consensus%20Messaging/ConsensusMessagingControlelr_createTopic`}
              >
                POST /document-management/consensus-messaging/topic
              </Anchor>{' '}
              creates a new topic on the Hedera Consensus Service and submits
              the initial message to it.
            </Text>

            <Text>
              <Anchor
                component={Link}
                to={`${CLIENT_DASHBOARD.DOC_MGT_REFERENCE}#/Consensus%20Messaging/ConsensusMessagingControlelr_createMessage`}
              >
                POST
                /document-management/consensus-messaging/&#123;topicId&#125;/message
              </Anchor>{' '}
              adds a new message to an existing topic on the Hedera Consensus
              Service.
            </Text>

            <Text>
              <Anchor
                component={Link}
                to={`${CLIENT_DASHBOARD.DOC_MGT_REFERENCE}#/Consensus%20Messaging/ConsensusMessagingControlelr_onchains`}
              >
                GET /document-management/consensus-messaging
              </Anchor>{' '}
              returns a list of all consensus messages.
            </Text>

            <Text>
              <Anchor
                component={Link}
                to={`${CLIENT_DASHBOARD.DOC_MGT_REFERENCE}#/Consensus%20Messaging/ConsensusMessagingControlelr_onchain`}
              >
                GET
                /document-management/consensus-messaging/&#123;requestId&#125;
              </Anchor>{' '}
              returns a consensus message based on <code>requestId</code>.
            </Text>
          </Stack>
        </div>
        <Space h="xl" />

        <Title id="extraction" order={5}>
          2.2 Extraction
        </Title>
        <Space h="md" />
        <div className={styles.subContent}>
          <Stack gap="sm">
            <Text>
              Extract structured data from documents based on prompt templates
              created in the dashboard. You can generate and manage your prompt
              templates under the{' '}
              <Anchor component={Link} to={CLIENT_DASHBOARD.DOC_MGT_TEMPLATES}>
                Prompt Templates
              </Anchor>{' '}
              section.
            </Text>

            <Text>
              <Anchor
                component={Link}
                to={`${CLIENT_DASHBOARD.DOC_MGT_REFERENCE}#/Extraction/DocumentExtractionController_initiateDocumentExtraction`}
              >
                POST /document-management/extraction
              </Anchor>{' '}
              extract data from the uploaded document (PDF, JPEG or PNG) based
              on the prompts from a template.
            </Text>

            <Text>
              <Anchor
                component={Link}
                to={`${CLIENT_DASHBOARD.DOC_MGT_REFERENCE}#/Extraction/DocumentExtractionController_documentExtractions`}
              >
                GET /document-management/extraction
              </Anchor>{' '}
              returns a list of all document extractions.
            </Text>

            <Text>
              <Anchor
                component={Link}
                to={`${CLIENT_DASHBOARD.DOC_MGT_REFERENCE}#/Extraction/DocumentExtractionController_documentExtraction`}
              >
                GET /document-management/extraction &#123;requestId&#125;
              </Anchor>{' '}
              returns a document extraction based on <code>requestId</code>.
            </Text>
          </Stack>
        </div>
      </div>
    </>
  );
};

export default ApiEndpoints;
