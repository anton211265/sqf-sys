import {
  Alert,
  Badge,
  Button,
  Card,
  Code,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBulb, IconSearch } from '@tabler/icons-react';
import React, { useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import {
  askOpportunityQuestion,
  getSavedOpportunityQueries,
  IOpportunityResult,
  runOpportunityQuery,
} from 'service/knowledgeGraph';

const ResultsTable: React.FC<{ rows: Record<string, unknown>[] }> = ({
  rows,
}) => {
  if (rows.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No matches in the graph with the current thresholds.
      </Text>
    );
  }
  const columns = Object.keys(rows[0]);
  return (
    <Table striped withTableBorder>
      <Table.Thead>
        <Table.Tr>
          {columns.map((column) => (
            <Table.Th key={column}>{column}</Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows.map((row, index) => (
          <Table.Tr key={index}>
            {columns.map((column) => (
              <Table.Td key={column}>
                {Array.isArray(row[column])
                  ? (row[column] as unknown[]).join(', ')
                  : String(row[column] ?? '—')}
              </Table.Td>
            ))}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
};

const Opportunities: React.FC = () => {
  const { data: savedQueries = [], isLoading } = useQuery(
    ['kg-opportunity-queries'],
    getSavedOpportunityQueries,
  );
  const [activeResult, setActiveResult] = useState<IOpportunityResult | null>(
    null,
  );
  const [question, setQuestion] = useState('');

  const runMutation = useMutation(
    (name: string) => runOpportunityQuery(name),
    {
      onSuccess: (result) => {
        setActiveResult(result);
      },
      onError: (error: any) => {
        notifications.show({
          title: 'Query failed',
          message: error?.response?.data?.message ?? (error as Error).message,
          color: 'red',
        });
      },
    },
  );

  const askMutation = useMutation(askOpportunityQuestion, {
    onError: (error: any) => {
      notifications.show({
        title: 'Question failed',
        message: error?.response?.data?.message ?? (error as Error).message,
        color: 'red',
      });
    },
  });

  return (
    <div className="p-6">
      <Title order={2} mb={4}>
        Opportunities
      </Title>
      <Text c="dimmed" size="sm" mb="md">
        GraphRAG prospecting over the trade network — saved lending-opportunity
        patterns, plus free-form questions answered from the knowledge graph.
      </Text>

      <Group align="stretch" mb="lg">
        {isLoading && <Loader size="sm" />}
        {savedQueries.map((savedQuery) => (
          <Card withBorder key={savedQuery.name} style={{ flex: 1, minWidth: 260 }}>
            <Stack gap="xs" justify="space-between" style={{ height: '100%' }}>
              <div>
                <Text fw={600}>{savedQuery.title}</Text>
                <Text size="sm" c="dimmed">
                  {savedQuery.description}
                </Text>
              </div>
              <Button
                size="compact-sm"
                color="primary"
                leftSection={<IconSearch size="0.9rem" />}
                loading={
                  runMutation.isLoading &&
                  runMutation.variables === savedQuery.name
                }
                onClick={() => runMutation.mutate(savedQuery.name)}
              >
                Run
              </Button>
            </Stack>
          </Card>
        ))}
      </Group>

      {activeResult && (
        <Card withBorder mb="lg">
          <Group justify="space-between" mb="sm">
            <Text fw={600}>{activeResult.title}</Text>
            <Badge color="primary" variant="light">
              {activeResult.count} match{activeResult.count === 1 ? '' : 'es'}
            </Badge>
          </Group>
          <ResultsTable rows={activeResult.results} />
        </Card>
      )}

      <Card withBorder>
        <Group mb="sm">
          <IconBulb size="1.1rem" />
          <Text fw={600}>Ask the graph</Text>
        </Group>
        <Textarea
          placeholder='e.g. "Which suppliers have the most capital tied up in unpaid invoices?"'
          value={question}
          onChange={(event) => setQuestion(event.currentTarget.value)}
          minRows={2}
          mb="sm"
        />
        <Button
          color="primary"
          disabled={!question.trim()}
          loading={askMutation.isLoading}
          onClick={() => askMutation.mutate(question)}
        >
          Ask
        </Button>

        {askMutation.data && (
          <Stack mt="md" gap="sm">
            <Alert color="blue" title="Analyst summary">
              {askMutation.data.summary}
            </Alert>
            <Text size="xs" c="dimmed">
              Cypher used:
            </Text>
            <Code block>{askMutation.data.cypher}</Code>
            <ResultsTable rows={askMutation.data.results} />
          </Stack>
        )}
      </Card>
    </div>
  );
};

export default Opportunities;
