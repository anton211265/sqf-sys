/**
 * Full graph rebuild from the trade-directory database.
 *
 * The graph is a projection — Postgres remains the system of record. This
 * script exists for recovery and for backfilling data that predates the
 * Kafka sync (e.g. organization names, which the outbox events don't carry).
 *
 * Run inside the knowledge-graph container:
 *   docker compose exec knowledge-graph-service \
 *     npx ts-node -r tsconfig-paths/register apps/knowledge-graph/src/scripts/rebuild-graph.ts
 *
 * Reads the trade-directory DB directly (read-only, dev/recovery tool) via
 * TRADE_DIRECTORY_DATABASE_URL.
 */
import neo4j from 'neo4j-driver';
import { Client } from 'pg';

async function main() {
  const pgUrl =
    process.env.TRADE_DIRECTORY_DATABASE_URL ??
    'postgresql://postgres:postgres@postgres:5432/trade-directory';
  const pg = new Client({ connectionString: pgUrl });
  await pg.connect();

  const driver = neo4j.driver(
    process.env.NEO4J_URI ?? 'bolt://neo4j:7687',
    neo4j.auth.basic(
      process.env.NEO4J_USERNAME ?? 'neo4j',
      process.env.NEO4J_PASSWORD ?? 'sqfgraph',
    ),
  );
  const session = driver.session();

  const run = async (cypher: string, params: Record<string, unknown> = {}) => {
    await session.run(cypher, params);
  };

  console.log('— Companies');
  const organizations = await pg.query(
    'SELECT id, "organizationName", country, "funderPersonaId", "clientPersonaId", "supplierPersonaId", "buyerPersonaId" FROM organization',
  );
  for (const org of organizations.rows) {
    await run(
      `MERGE (c:Company {orgId: $orgId})
       SET c.name = $name, c.country = $country,
           c.isFunder = $isFunder, c.isClient = $isClient,
           c.isSupplier = $isSupplier, c.isBuyer = $isBuyer`,
      {
        orgId: org.id,
        name: org.organizationName,
        country: org.country,
        isFunder: org.funderPersonaId != null,
        isClient: org.clientPersonaId != null,
        isSupplier: org.supplierPersonaId != null,
        isBuyer: org.buyerPersonaId != null,
      },
    );
  }
  console.log(`  ${organizations.rowCount} companies`);

  console.log('— SUPPLIES_TO relationships');
  const relationships = await pg.query('SELECT * FROM relationship');
  for (const rel of relationships.rows) {
    await run(
      `MATCH (supplier:Company {orgId: $from}), (buyer:Company {orgId: $to})
       MERGE (supplier)-[r:SUPPLIES_TO]->(buyer)
       SET r.relationshipId = $id, r.paymentTermsDays = $terms,
           r.yearlyVolumeChangePct = $growth, r.totalTradeVolume = $volume,
           r.tradeCurrency = $currency, r.status = $status,
           r.funderPersonaId = $funder`,
      {
        from: rel.fromOrganizationId,
        to: rel.toOrganizationId,
        id: rel.id,
        terms: rel.paymentTermsDays,
        growth: rel.yearlyVolumeChangePct != null ? Number(rel.yearlyVolumeChangePct) : null,
        volume: rel.totalTradeVolume != null ? Number(rel.totalTradeVolume) : null,
        currency: rel.tradeCurrency,
        status: rel.status,
        funder: rel.funderPersonaId,
      },
    );
  }
  console.log(`  ${relationships.rowCount} relationships`);

  console.log('— Contracts');
  const contracts = await pg.query('SELECT * FROM contract');
  for (const contract of contracts.rows) {
    await run(
      `MERGE (c:Contract {contractId: $id})
       SET c.contractType = $type, c.lendingProduct = $product,
           c.reference = $reference, c.contractValue = $value,
           c.currency = $currency, c.status = $status,
           c.funderPersonaId = $funder
       WITH c
       MATCH (first:Company {orgId: $firstParty}), (second:Company {orgId: $secondParty})
       MERGE (first)-[:PARTY_TO]->(c)
       MERGE (second)-[:PARTY_TO]->(c)
       FOREACH (_ IN CASE WHEN $type = 'FACILITY_AGREEMENT' THEN [1] ELSE [] END |
         MERGE (second)-[:HAS_FACILITY]->(c)
         MERGE (second)-[:CLIENT_OF]->(first)
       )`,
      {
        id: contract.id,
        type: contract.contractType,
        product: contract.lendingProduct,
        reference: contract.reference,
        value: contract.contractValue != null ? Number(contract.contractValue) : null,
        currency: contract.currency,
        status: contract.status,
        funder: contract.funderPersonaId,
        firstParty: contract.firstPartyOrganizationId,
        secondParty: contract.secondPartyOrganizationId,
      },
    );
  }
  console.log(`  ${contracts.rowCount} contracts`);

  console.log('— Invoices');
  const invoices = await pg.query('SELECT * FROM invoice');
  for (const invoice of invoices.rows) {
    await run(
      `MERGE (i:Invoice {invoiceId: $id})
       SET i.invoiceNumber = $number, i.amount = $amount, i.currency = $currency,
           i.status = $status, i.issueDate = $issueDate, i.dueDate = $dueDate,
           i.lendingProduct = $product, i.funderPersonaId = $funder
       WITH i
       MATCH (issuer:Company {orgId: $issuer}), (debtor:Company {orgId: $debtor})
       MERGE (issuer)-[:ISSUED_INVOICE]->(i)
       MERGE (i)-[:OWED_BY]->(debtor)`,
      {
        id: invoice.id,
        number: invoice.invoiceNumber,
        // graph property names stay amount/currency; sourced from the UBL
        // payableAmount/documentCurrencyCode header columns.
        amount: invoice.payableAmount != null ? Number(invoice.payableAmount) : null,
        currency: invoice.documentCurrencyCode,
        status: invoice.status,
        issueDate: invoice.issueDate ? String(invoice.issueDate) : null,
        dueDate: invoice.dueDate ? String(invoice.dueDate) : null,
        product: invoice.lendingProduct,
        funder: invoice.funderPersonaId,
        issuer: invoice.issuerOrganizationId,
        debtor: invoice.debtorOrganizationId,
      },
    );
  }
  console.log(`  ${invoices.rowCount} invoices`);

  await session.close();
  await driver.close();
  await pg.end();
  console.log('Graph rebuild complete.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
