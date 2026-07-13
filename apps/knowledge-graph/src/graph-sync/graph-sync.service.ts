import { Injectable, Logger } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';

// Consumes the trade-directory outbox events and projects them into the graph.
// All upserts are MERGE-based, and every event is additionally recorded as a
// ProcessedEvent node — the graph-side equivalent of the processed_event
// idempotency table used by the Postgres-backed services.
@Injectable()
export class GraphSyncService {
  private readonly logger = new Logger(GraphSyncService.name);

  constructor(private readonly neo4j: Neo4jService) {}

  // Returns true when the event has NOT been seen before (and marks it seen).
  private async firstTimeSeen(eventId: string): Promise<boolean> {
    if (!eventId) return true;
    const result = await this.neo4j.write(
      `MERGE (e:ProcessedEvent {eventId: $eventId})
       ON CREATE SET e.processedAt = datetime(), e._created = true
       WITH e, coalesce(e._created, false) AS created
       REMOVE e._created
       RETURN created`,
      { eventId },
    );
    return result.records[0]?.get('created') === true;
  }

  async upsertRelationship(payload: Record<string, any>) {
    if (!(await this.firstTimeSeen(payload.eventId))) {
      this.logger.log(`Skipping already-processed event ${payload.eventId}`);
      return;
    }
    await this.neo4j.write(
      `MERGE (supplier:Company {orgId: $fromOrganizationId})
       MERGE (buyer:Company {orgId: $toOrganizationId})
       MERGE (supplier)-[r:SUPPLIES_TO]->(buyer)
       SET r.relationshipId = $relationshipId,
           r.paymentTermsDays = $paymentTermsDays,
           r.yearlyVolumeChangePct = $yearlyVolumeChangePct,
           r.totalTradeVolume = $totalTradeVolume,
           r.tradeCurrency = $tradeCurrency,
           r.status = $status,
           r.funderPersonaId = $funderPersonaId`,
      {
        fromOrganizationId: payload.fromOrganizationId,
        toOrganizationId: payload.toOrganizationId,
        relationshipId: payload.id,
        paymentTermsDays: payload.paymentTermsDays ?? null,
        yearlyVolumeChangePct: payload.yearlyVolumeChangePct != null ? Number(payload.yearlyVolumeChangePct) : null,
        totalTradeVolume: payload.totalTradeVolume != null ? Number(payload.totalTradeVolume) : null,
        tradeCurrency: payload.tradeCurrency ?? null,
        status: payload.status,
        funderPersonaId: payload.funderPersonaId,
      },
    );
    this.logger.log(
      `Upserted SUPPLIES_TO ${payload.fromOrganizationId} -> ${payload.toOrganizationId}`,
    );
  }

  async upsertContract(payload: Record<string, any>) {
    if (!(await this.firstTimeSeen(payload.eventId))) {
      this.logger.log(`Skipping already-processed event ${payload.eventId}`);
      return;
    }
    await this.neo4j.write(
      `MERGE (contract:Contract {contractId: $contractId})
       SET contract.contractType = $contractType,
           contract.lendingProduct = $lendingProduct,
           contract.reference = $reference,
           contract.contractValue = $contractValue,
           contract.currency = $currency,
           contract.status = $status,
           contract.funderPersonaId = $funderPersonaId
       MERGE (firstParty:Company {orgId: $firstPartyOrganizationId})
       MERGE (secondParty:Company {orgId: $secondPartyOrganizationId})
       MERGE (firstParty)-[:PARTY_TO]->(contract)
       MERGE (secondParty)-[:PARTY_TO]->(contract)
       FOREACH (_ IN CASE WHEN $contractType = 'FACILITY_AGREEMENT' THEN [1] ELSE [] END |
         MERGE (secondParty)-[:HAS_FACILITY]->(contract)
         MERGE (secondParty)-[:CLIENT_OF]->(firstParty)
       )`,
      {
        contractId: payload.id,
        contractType: payload.contractType,
        lendingProduct: payload.lendingProduct ?? null,
        reference: payload.reference ?? null,
        contractValue: payload.contractValue != null ? Number(payload.contractValue) : null,
        currency: payload.currency ?? null,
        status: payload.status,
        funderPersonaId: payload.funderPersonaId,
        firstPartyOrganizationId: payload.firstPartyOrganizationId,
        secondPartyOrganizationId: payload.secondPartyOrganizationId,
      },
    );
    this.logger.log(`Upserted Contract ${payload.id} (${payload.contractType})`);
  }

  async upsertInvoice(payload: Record<string, any>) {
    if (!(await this.firstTimeSeen(payload.eventId))) {
      this.logger.log(`Skipping already-processed event ${payload.eventId}`);
      return;
    }
    await this.neo4j.write(
      `MERGE (invoice:Invoice {invoiceId: $invoiceId})
       SET invoice.invoiceNumber = $invoiceNumber,
           invoice.amount = $amount,
           invoice.currency = $currency,
           invoice.status = $status,
           invoice.issueDate = $issueDate,
           invoice.dueDate = $dueDate,
           invoice.lendingProduct = $lendingProduct,
           invoice.funderPersonaId = $funderPersonaId
       MERGE (issuer:Company {orgId: $issuerOrganizationId})
       MERGE (debtor:Company {orgId: $debtorOrganizationId})
       MERGE (issuer)-[:ISSUED_INVOICE]->(invoice)
       MERGE (invoice)-[:OWED_BY]->(debtor)`,
      {
        invoiceId: payload.id,
        invoiceNumber: payload.invoiceNumber,
        // "amount"/"currency" graph properties are kept for the opportunity
        // Cypher queries; sourced from the UBL payableAmount/documentCurrencyCode
        // header fields (see docs/design/trade-directory-redesign.md — invoice
        // now mirrors the OASIS UBL 2.5 Invoice schema).
        amount: payload.payableAmount != null ? Number(payload.payableAmount) : null,
        currency: payload.documentCurrencyCode,
        status: payload.status,
        issueDate: payload.issueDate ?? null,
        dueDate: payload.dueDate ?? null,
        lendingProduct: payload.lendingProduct ?? null,
        funderPersonaId: payload.funderPersonaId,
        issuerOrganizationId: payload.issuerOrganizationId,
        debtorOrganizationId: payload.debtorOrganizationId,
      },
    );
    this.logger.log(
      `Upserted Invoice ${payload.invoiceNumber} (${payload.status})`,
    );
  }
}
