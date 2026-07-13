import Anthropic from '@anthropic-ai/sdk';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Neo4jService } from '../neo4j/neo4j.service';

interface SavedQuery {
  name: string;
  title: string;
  description: string;
  cypher: string;
  defaults: Record<string, number>;
}

// The three opportunity patterns from the trade-directory redesign design doc
// (§4.3). Thresholds are parameterised so they can be tuned per funder; the
// defaults follow the design doc.
const SAVED_QUERIES: SavedQuery[] = [
  {
    name: 'scf-anchor',
    title: 'Supply Chain Finance anchor buyers',
    description:
      'Buyers with long payment cycles across several active suppliers — candidates to anchor a payables (reverse factoring) facility.',
    cypher: `
      MATCH (buyer:Company)<-[r:SUPPLIES_TO]-(supplier:Company)
      WHERE r.status = 'ACTIVE' AND coalesce(r.paymentTermsDays, 0) >= $minPaymentTermsDays
      WITH buyer, count(supplier) AS supplierCount, collect(supplier.name) AS suppliers,
           sum(coalesce(r.totalTradeVolume, 0)) AS totalVolume
      WHERE supplierCount >= $minSuppliers
      RETURN buyer.name AS targetBuyer, buyer.orgId AS buyerOrgId,
             supplierCount AS leadStrengthScore, suppliers AS impactedSuppliers,
             totalVolume AS totalTradeVolume
      ORDER BY leadStrengthScore DESC, totalVolume DESC
      LIMIT 50`,
    defaults: { minPaymentTermsDays: 60, minSuppliers: 1 },
  },
  {
    name: 'invoice-factoring',
    title: 'Invoice factoring prospects',
    description:
      'Suppliers with significant capital tied up in unsettled invoices. (Cross-directorship warm paths land once DIRECTOR_OF data exists.)',
    cypher: `
      MATCH (supplier:Company)-[:ISSUED_INVOICE]->(invoice:Invoice)
      WHERE NOT invoice.status IN ['PAID', 'CLOSED', 'REJECTED']
      WITH supplier, sum(coalesce(invoice.amount, 0)) AS tiedUpCapital,
           count(invoice) AS openInvoices
      WHERE tiedUpCapital >= $minTiedUpCapital
      RETURN supplier.name AS prospectSupplier, supplier.orgId AS supplierOrgId,
             openInvoices, tiedUpCapital AS immediateFactoringVolume
      ORDER BY immediateFactoringVolume DESC
      LIMIT 50`,
    defaults: { minTiedUpCapital: 100000 },
  },
  {
    name: 'term-loan-growth',
    title: 'Term loan growth candidates',
    description:
      'Suppliers whose traded volume is growing fast and who have no term-loan facility yet — structural CapEx lending candidates.',
    cypher: `
      MATCH (supplier:Company)-[r:SUPPLIES_TO]->(buyer:Company)
      WHERE coalesce(r.yearlyVolumeChangePct, 0) > $minGrowthPct
        AND NOT EXISTS {
          MATCH (supplier)-[:HAS_FACILITY]->(facility:Contract)
          WHERE facility.lendingProduct = 'TERM_LOAN'
        }
      WITH supplier, count(buyer) AS activeBuyers,
           sum(coalesce(r.totalTradeVolume, 0)) AS totalTradeFootprint,
           max(r.yearlyVolumeChangePct) AS topGrowthPct
      RETURN supplier.name AS highGrowthSupplier, supplier.orgId AS supplierOrgId,
             activeBuyers AS totalTradingPartners, topGrowthPct,
             totalTradeFootprint
      ORDER BY totalTradeFootprint DESC
      LIMIT 50`,
    defaults: { minGrowthPct: 25 },
  },
];

// Statements the NL->Cypher path must never produce. The graph is a
// projection — every write path goes through graph-sync, never through here.
const WRITE_CYPHER = /\b(CREATE|MERGE|DELETE|DETACH|SET|REMOVE|DROP|LOAD\s+CSV|FOREACH|CALL\s+db\.|CALL\s+dbms\.|CALL\s+apoc\.)\b/i;

const GRAPH_SCHEMA_PROMPT = `The Neo4j graph models a supply-chain-finance trade network:
Nodes:
- (:Company {orgId: int, name: string})
- (:Invoice {invoiceId: int, invoiceNumber: string, amount: float, currency: string, status: string (UPLOADED|VALIDATED|APPROVED_FOR_FINANCE|PRESENTED|FINANCED|PARTIALLY_PAID|PAID|OVERDUE|CLOSED|REJECTED), dueDate: string, lendingProduct: string})
- (:Contract {contractId: int, contractType: string (FACILITY_AGREEMENT|COMMERCIAL), lendingProduct: string (AR_FINANCE|SUPPLY_CHAIN_FINANCE|INVOICE_FACTORING|TERM_LOAN), contractValue: float, status: string, reference: string})
Relationships:
- (supplier:Company)-[:SUPPLIES_TO {paymentTermsDays: int, yearlyVolumeChangePct: float, totalTradeVolume: float, status: string}]->(buyer:Company)
- (issuer:Company)-[:ISSUED_INVOICE]->(:Invoice)-[:OWED_BY]->(debtor:Company)
- (:Company)-[:PARTY_TO]->(:Contract)
- (client:Company)-[:HAS_FACILITY]->(:Contract) — facility agreements only
- (client:Company)-[:CLIENT_OF]->(funder:Company)`;

@Injectable()
export class OpportunitiesService {
  private readonly logger = new Logger(OpportunitiesService.name);
  private readonly anthropic?: Anthropic;

  constructor(
    private readonly neo4j: Neo4jService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get('ANTHROPIC_API_KEY');
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
    }
  }

  listSavedQueries() {
    return SAVED_QUERIES.map(({ name, title, description, defaults }) => ({
      name,
      title,
      description,
      parameters: defaults,
    }));
  }

  async runSavedQuery(name: string, overrides: Record<string, string>) {
    const savedQuery = SAVED_QUERIES.find((query) => query.name === name);
    if (!savedQuery) {
      throw new NotFoundException(`Unknown opportunity query: ${name}`);
    }
    const params: Record<string, number> = { ...savedQuery.defaults };
    for (const [key, value] of Object.entries(overrides)) {
      if (key in params && !Number.isNaN(Number(value))) {
        params[key] = Number(value);
      }
    }
    const rows = await this.neo4j.read(savedQuery.cypher, params);
    return {
      name: savedQuery.name,
      title: savedQuery.title,
      parameters: params,
      count: rows.length,
      results: rows,
    };
  }

  // GraphRAG: natural-language question -> read-only Cypher -> results -> summary.
  async naturalLanguageQuery(question: string) {
    if (!this.anthropic) {
      throw new ServiceUnavailableException(
        'ANTHROPIC_API_KEY is not configured — natural-language querying is unavailable. The saved opportunity queries still work.',
      );
    }

    const model =
      this.configService.get('ANTHROPIC_MODEL') ?? 'claude-sonnet-5';

    const cypherResponse = await this.anthropic.messages.create({
      model,
      max_tokens: 800,
      system: `You translate a funder's sales-prospecting question into a single READ-ONLY Neo4j Cypher query.
${GRAPH_SCHEMA_PROMPT}
Rules: output ONLY the Cypher query, no prose, no code fences. Never use CREATE/MERGE/SET/DELETE/REMOVE/DROP/CALL. Always end with LIMIT 50 or lower.`,
      messages: [{ role: 'user', content: question }],
    });

    const cypher =
      cypherResponse.content[0]?.type === 'text'
        ? cypherResponse.content[0].text.trim()
        : '';

    if (!cypher || WRITE_CYPHER.test(cypher)) {
      throw new BadRequestException(
        'Could not derive a safe read-only query from that question — rephrase it.',
      );
    }

    let rows: Record<string, unknown>[];
    try {
      rows = await this.neo4j.read(cypher);
    } catch (error) {
      this.logger.warn(`Generated Cypher failed: ${cypher}`);
      throw new BadRequestException(
        `The generated query failed against the graph: ${(error as Error).message}`,
      );
    }

    const summaryResponse = await this.anthropic.messages.create({
      model,
      max_tokens: 600,
      system:
        'You are a commercial-lending sales analyst. Summarise the query results for a relationship manager in 2-4 sentences, then, if the results contain concrete prospects, add one short actionable pitch angle. Be factual — only reference what is in the data.',
      messages: [
        {
          role: 'user',
          content: `Question: ${question}\nCypher used: ${cypher}\nResults (JSON): ${JSON.stringify(rows).slice(0, 6000)}`,
        },
      ],
    });

    const summary =
      summaryResponse.content[0]?.type === 'text'
        ? summaryResponse.content[0].text
        : '';

    return { question, cypher, count: rows.length, results: rows, summary };
  }
}
