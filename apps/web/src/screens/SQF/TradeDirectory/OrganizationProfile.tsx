import {
  Button,
  Card,
  Grid,
  Group,
  Table,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconArrowLeft, IconPlus } from '@tabler/icons-react';
import { TRADE_DIRECTORY } from 'constants/routes';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useContracts,
  useDirectoryOrganizations,
  useInvoices,
  useRelationships,
} from 'hooks/useTradeDirectory';
import {
  ContractStatusBadge,
  InvoiceStatusBadge,
  LendingProductBadge,
  PersonaBadges,
  RelationshipStatusBadge,
} from './components/Badges';
import CreateRelationshipModal from './components/CreateRelationshipModal';

const OrganizationProfile: React.FC = () => {
  const { organizationId } = useParams();
  const navigate = useNavigate();
  const orgId = Number(organizationId);

  const { data: organizations = [] } = useDirectoryOrganizations();
  const organization = organizations.find((o) => o.id === orgId);

  const { data: relationships = [] } = useRelationships(orgId);
  const { data: contracts = [] } = useContracts({ organizationId: orgId });
  const { data: invoicesIssued = [] } = useInvoices({
    issuerOrganizationId: orgId,
  });
  const { data: invoicesOwed = [] } = useInvoices({
    debtorOrganizationId: orgId,
  });
  const [
    relationshipModalOpened,
    { open: openRelationshipModal, close: closeRelationshipModal },
  ] = useDisclosure(false);

  const invoices = [
    ...invoicesIssued,
    ...invoicesOwed.filter(
      (owed) => !invoicesIssued.some((issued) => issued.id === owed.id),
    ),
  ];

  return (
    <div className="p-6">
      <Button
        variant="subtle"
        size="compact-sm"
        leftSection={<IconArrowLeft size="1rem" />}
        onClick={() => navigate(TRADE_DIRECTORY.HOME)}
        mb="sm"
      >
        Directory
      </Button>
      <Group justify="space-between" mb="md">
        <div>
          <Title order={2}>{organization?.organizationName ?? `Organisation ${orgId}`}</Title>
          {organization && (
            <Group mt={6}>
              <PersonaBadges personas={organization.personas} />
            </Group>
          )}
        </div>
      </Group>

      <Tabs defaultValue="overview" color="primary">
        <Tabs.List>
          <Tabs.Tab value="overview">Overview</Tabs.Tab>
          <Tabs.Tab value="relationships">
            Relationships ({relationships.length})
          </Tabs.Tab>
          <Tabs.Tab value="contracts">Contracts ({contracts.length})</Tabs.Tab>
          <Tabs.Tab value="invoices">Invoices ({invoices.length})</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="md">
          <Card withBorder>
            <Grid>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">
                  Registration No.
                </Text>
                <Text>{organization?.businessRegistrationNumber ?? '—'}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">
                  Country
                </Text>
                <Text>{organization?.country ?? '—'}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">
                  Email
                </Text>
                <Text>{organization?.emailAddress ?? '—'}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">
                  Contact
                </Text>
                <Text>{organization?.contactNumber ?? '—'}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">
                  Fully onboarded
                </Text>
                <Text>
                  {organization?.fullyOnboardedAt
                    ? new Date(organization.fullyOnboardedAt).toLocaleDateString()
                    : 'No'}
                </Text>
              </Grid.Col>
            </Grid>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="relationships" pt="md">
          <Group justify="flex-end" mb="sm">
            <Button
              size="compact-sm"
              color="primary"
              leftSection={<IconPlus size="1rem" />}
              onClick={openRelationshipModal}
            >
              New relationship
            </Button>
          </Group>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Supplier</Table.Th>
                <Table.Th>Buyer</Table.Th>
                <Table.Th>Payment terms</Table.Th>
                <Table.Th>Trade volume</Table.Th>
                <Table.Th>YoY change</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {relationships.map((relationship) => (
                <Table.Tr key={relationship.id}>
                  <Table.Td>
                    {relationship.fromOrganization?.organizationName ??
                      relationship.fromOrganizationId}
                    {relationship.fromOrganizationId === orgId && ' (this org)'}
                  </Table.Td>
                  <Table.Td>
                    {relationship.toOrganization?.organizationName ??
                      relationship.toOrganizationId}
                    {relationship.toOrganizationId === orgId && ' (this org)'}
                  </Table.Td>
                  <Table.Td>
                    {relationship.paymentTermsDays
                      ? `${relationship.paymentTermsDays} days`
                      : '—'}
                  </Table.Td>
                  <Table.Td>
                    {relationship.totalTradeVolume
                      ? `${Number(relationship.totalTradeVolume).toLocaleString()} ${relationship.tradeCurrency ?? ''}`
                      : '—'}
                  </Table.Td>
                  <Table.Td>
                    {relationship.yearlyVolumeChangePct != null
                      ? `${relationship.yearlyVolumeChangePct}%`
                      : '—'}
                  </Table.Td>
                  <Table.Td>
                    <RelationshipStatusBadge status={relationship.status} />
                  </Table.Td>
                </Table.Tr>
              ))}
              {relationships.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text c="dimmed" size="sm">
                      No trading relationships recorded yet.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="contracts" pt="md">
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Reference</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Product</Table.Th>
                <Table.Th>Parties</Table.Th>
                <Table.Th>Value</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {contracts.map((contract) => (
                <Table.Tr key={contract.id}>
                  <Table.Td>{contract.reference ?? `#${contract.id}`}</Table.Td>
                  <Table.Td>
                    {contract.contractType === 'FACILITY_AGREEMENT'
                      ? 'Facility'
                      : 'Commercial'}
                  </Table.Td>
                  <Table.Td>
                    <LendingProductBadge product={contract.lendingProduct} />
                  </Table.Td>
                  <Table.Td>
                    {contract.firstPartyOrganization?.organizationName} ↔{' '}
                    {contract.secondPartyOrganization?.organizationName}
                  </Table.Td>
                  <Table.Td>
                    {contract.contractValue
                      ? `${Number(contract.contractValue).toLocaleString()} ${contract.currency ?? ''}`
                      : '—'}
                  </Table.Td>
                  <Table.Td>
                    <ContractStatusBadge status={contract.status} />
                  </Table.Td>
                </Table.Tr>
              ))}
              {contracts.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text c="dimmed" size="sm">
                      No contracts recorded yet.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="invoices" pt="md">
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Invoice No.</Table.Th>
                <Table.Th>Issuer</Table.Th>
                <Table.Th>Debtor</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Due</Table.Th>
                <Table.Th>Product</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {invoices.map((invoice) => (
                <Table.Tr key={invoice.id}>
                  <Table.Td>{invoice.invoiceNumber}</Table.Td>
                  <Table.Td>
                    {invoice.issuerOrganization?.organizationName ??
                      invoice.issuerOrganizationId}
                  </Table.Td>
                  <Table.Td>
                    {invoice.debtorOrganization?.organizationName ??
                      invoice.debtorOrganizationId}
                  </Table.Td>
                  <Table.Td>
                    {Number(invoice.amount).toLocaleString()} {invoice.currency}
                  </Table.Td>
                  <Table.Td>{invoice.dueDate}</Table.Td>
                  <Table.Td>
                    <LendingProductBadge product={invoice.lendingProduct} />
                  </Table.Td>
                  <Table.Td>
                    <InvoiceStatusBadge status={invoice.status} />
                  </Table.Td>
                </Table.Tr>
              ))}
              {invoices.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text c="dimmed" size="sm">
                      No invoices recorded yet.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>
      </Tabs>

      <CreateRelationshipModal
        opened={relationshipModalOpened}
        onClose={closeRelationshipModal}
        fixedFromOrganizationId={orgId}
      />
    </div>
  );
};

export default OrganizationProfile;
