# Trade Directory Service — Redesign

Source: `SQF ARCHITECTURE/New trade directory service.docx` (Tony, 2026-07)
Decisions confirmed 2026-07-12: global Factor→Funder rename now; invoice/contract/relationship tables live in trade-directory; knowledge graph designed now (Neo4j), built after Phase 2.

> **Status (2026-07-13): Phases 0–4 implemented.** DDL migrations in `docs/design/migrations/`. Notable deltas from this design: SPA routes live under `/directory/*` (the Vite dev proxy owns `/trade-directory/*`); the KG service's idempotency check uses `ProcessedEvent` nodes in Neo4j instead of a Postgres table (the graph is the service's only store); KG sync consumes the three `*_UPSERTED`/`INVOICE_STATUS_CHANGED` topics directly rather than a single `SQF_GRAPH_SYNC` topic.

---

## 1. Actor Model & Terminology

| Actor | Definition |
|---|---|
| **SQFSYS** | SaaS operator (Synlian Quantum Finance platform). Builds a new cloud infrastructure per Funder (dev/stage/prod), creates the Funder SuperAdmin account, migrates Funder data, provides monitoring/ITSM/SecOps, bills the Funder. One deployment per Funder — tenant isolation at the infrastructure level. |
| **Funder** | A registered/regulated lending company (currently "Factor" in code). Offers 4 lending products. |
| **Client** | An organization contracted to the Funder, subscribed to 1+ lending products. |
| **Supplier** | An organization that supplies goods/services to another organization. |
| **Buyer** | An organization that buys from suppliers (currently "Contract Awarder" in code). |

### Lending Products (LP)

| Code | Product |
|---|---|
| `AR_FINANCE` | Account Receivable Finance |
| `SUPPLY_CHAIN_FINANCE` | Supply Chain Finance (reverse factoring / payables automation) |
| `INVOICE_FACTORING` | Invoice Factoring |
| `TERM_LOAN` | Term Loan |

### Product flows (side-by-side, from design doc)

| Step | AR | SCF | IF | TL |
|---|---|---|---|---|
| 1 | Client uploads invoices | Buyer uploads approved invoices | Client uploads invoices + docs | Client registers, uploads company data |
| 2 | Funder validates invoice, reviews funding request | Funder presents approved invoices to Supplier | Funder validates, credit/compliance checks | Funder reviews, credit/compliance checks |
| 3 | Funder purchases/finances receivable | Supplier requests early payment (discounting) | Funder agrees to purchase receivable | Funder approves loan (Facility Loan Agreement) |
| 4 | Funder advances funds to Client | Funder purchases receivable | Funder advances 80–95% of invoice value | Funder disburses loan |
| 5 | Invoice status updated; Client manages receivable | Supplier paid less discount (T+1/T+2) | Invoice ownership transferred to Funder | Client repays per agreement + fees/interest |
| 6 | Client repays Funder at maturity | Buyer pays 100% to Funder at maturity | Buyer pays Funder collection account at maturity | — |
| 7 | Complete | Complete | Funder deducts fees, remits reserve to Client | — |

### Personas

Unchanged in principle from current design: an organization can hold **multiple personas simultaneously** (Client, Supplier, Buyer — and Funder for the tenant org). Example from the doc's scenarios:

| Company | Client | Supplier | Buyer |
|---|---|---|---|
| A | Yes | Yes | No |
| B | Yes | Yes | Yes |
| C | Yes | No | Yes |

(Scenario walk-through: A is a Client for AR finance and B is stored as its Buyer → B later becomes a Client for invoice factoring, with A as its Supplier and C as its Buyer → C later becomes an SCF Client, with A and B as its Suppliers.)

---

## 2. Taxonomy Renames

All three renames happen in **Phase 1**, backend + DB + Kafka + frontend together. Pre-production, no data-preservation constraints — but DDL is still written as `RENAME` (not drop/recreate) because local dev DBs have seeded data worth keeping.

### 2.1 Factor → Funder (global)

The biggest one: `factorPersonaId` is the cross-service tenant key (~109 direct references; risk-operation, CRM, document-management all carry it).

| Current | New |
|---|---|
| `FactorPersona` entity, `factor_persona` table | `FunderPersona`, `funder_persona` |
| `factorPersonaId` (Organization + Application + everywhere) | `funderPersonaId` |
| `apps/trade-directory/src/factor-persona/` module | `funder-persona/` |
| Proto enums / converters containing FACTOR | FUNDER |
| Frontend labels "Factor", `FACTOR` enum values | "Funder", `FUNDER` |
| Seed script `seed-factor.ts`, "Factor Organization" | `seed-funder.ts`, "Funder Organization" |

⚠️ **Not a blind find/replace.** `CaslAbilityFactory`, `factoryAddress`, "refactor" etc. contain the substring. Rename by exact identifiers: `FactorPersona`, `factorPersona`, `factor_persona`, `FACTOR` (enum member), display string `Factor`.

DDL (per affected DB):

```sql
-- trade-directory
ALTER TABLE factor_persona RENAME TO funder_persona;
ALTER TABLE organization RENAME COLUMN "factorPersonaId" TO "funderPersonaId";
-- risk-operation (application + related tables)
ALTER TABLE application RENAME COLUMN "factorPersonaId" TO "funderPersonaId";
-- + any other table found by: SELECT table_name FROM information_schema.columns WHERE column_name = 'factorPersonaId';
```

### 2.2 Contract Awarder → Buyer

| Current | New |
|---|---|
| `ContractAwarderPersona`, `contract_awarder_persona` table | `BuyerPersona`, `buyer_persona` |
| `contractAwarderPersonaId` | `buyerPersonaId` |
| `contract-awarder-persona/` module + subscriber + repository | `buyer-persona/` |
| Transaction relations `firstPartyAsContractAwarderPersona` etc. | `firstPartyAsBuyerPersona` etc. |
| Frontend labels "Contract Awarder" | "Buyer" |

### 2.3 Experian → KYC Agency

Generalises the credit-bureau integration so Experian is one provider of many (CTOS, CCRIS, etc. later).

| Current | New |
|---|---|
| `Experian` entity, `experian` table | `KycAgencyReport`, `kyc_agency_report` |
| `experian/` + `sqf/experian/` modules | `kyc-agency/` |
| `ExperianReportStatus/Source/Type` enums | `KycReportStatus/Source/Type` |
| Kafka `REQUEST_EXPERIAN_REPORT` / `RECEIVE_EXPERIAN_REPORT` | `REQUEST_KYC_REPORT` / `RECEIVE_KYC_REPORT` |
| `organization.experianBusinessSector`, `experianNatureOfBusiness` | `kycBusinessSector`, `kycNatureOfBusiness` |
| Frontend "Experian report" labels/consent form | "KYC agency report" (agency name shown from data) |

New column on the report table: `agency VARCHAR NOT NULL DEFAULT 'EXPERIAN'` (enum `KycAgencyEnum { EXPERIAN }`, extensible).

Kafka topic rename touches trade-directory (consumer of REQUEST, producer of RECEIVE) and risk-operation (producer of REQUEST, consumer of RECEIVE) — outbox event types and processed-event handling included.

---

## 3. New Tables (all in trade-directory DB)

### 3.1 `relationship` — org-to-org trading relationships

The core of the new trade directory: who trades with whom, independent of any one invoice.

```sql
CREATE TABLE relationship (
  id                     SERIAL PRIMARY KEY,
  "funderPersonaId"      INT NOT NULL,                -- tenant scope
  "fromOrganizationId"   INT NOT NULL REFERENCES organization(id),
  "toOrganizationId"     INT NOT NULL REFERENCES organization(id),
  "relationshipType"     VARCHAR NOT NULL,            -- RelationshipTypeEnum
  "paymentTermsDays"     INT,
  "yearlyVolumeChangePct" DECIMAL(8,2),               -- feeds KG term-loan pattern
  "totalTradeVolume"     DECIMAL(15,2),
  "tradeCurrency"        VARCHAR(3),
  status                 VARCHAR NOT NULL DEFAULT 'ACTIVE',
  "createdAt"            TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP,
  "updatedAt"            TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP,
  UNIQUE ("fromOrganizationId", "toOrganizationId", "relationshipType")
);
```

`RelationshipTypeEnum` v1: `SUPPLIES_TO` (from = supplier, to = buyer). Reserved for later (KG-driven): `SUBSIDIARY_OF`, `SHARES_DIRECTOR_WITH`. Direction matters; the inverse ("BUYS_FROM") is implied, never stored.

### 3.2 `contract` — Funder↔Client facilities and org↔org commercial contracts

```sql
CREATE TABLE contract (
  id                        SERIAL PRIMARY KEY,
  "funderPersonaId"         INT NOT NULL,
  "contractType"            VARCHAR NOT NULL,          -- FACILITY_AGREEMENT | COMMERCIAL
  "firstPartyOrganizationId" INT NOT NULL REFERENCES organization(id),
  "secondPartyOrganizationId" INT NOT NULL REFERENCES organization(id),
  "relationshipId"          INT REFERENCES relationship(id),  -- COMMERCIAL only
  "lendingProduct"          VARCHAR,                   -- FACILITY_AGREEMENT only
  reference                 VARCHAR,
  "startDate"               DATE,
  "endDate"                 DATE,
  "contractValue"           DECIMAL(15,2),
  currency                  VARCHAR(3),
  "paymentTermsDays"        INT,
  status                    VARCHAR NOT NULL DEFAULT 'DRAFT', -- DRAFT|ACTIVE|EXPIRED|TERMINATED
  "documentReference"       VARCHAR,                   -- document-management requestId
  "createdAt"               TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP,
  "updatedAt"               TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP
);
```

- `FACILITY_AGREEMENT`: firstParty = Funder org, secondParty = Client org, `lendingProduct` set. This is the TL "Facility Loan Agreement" and the umbrella for AR/SCF/IF facilities.
- `COMMERCIAL`: org↔org trade contract, optionally linked to its `relationship` row.

### 3.3 `invoice` (updated 2026-07-13 — aligned to OASIS UBL 2.5)

> The invoice table below was superseded on 2026-07-13 to mirror the OASIS
> UBL 2.5 Invoice document (source: `SQF ARCHITECTURE/SCEHMA/ubl-invoice-{schema.json,data-dictionary.md}`).
> See §3.3.1 for the as-built schema; §3.3 (below) is kept for history since
> the original design predates the UBL alignment request.
>
> **What changed:** the flat `amount`/`currency` columns were replaced with
> the full UBL LegalMonetaryTotal breakdown (lineExtensionAmount,
> taxExclusiveAmount, taxInclusiveAmount, payableAmount, …), plus header
> fields (invoiceTypeCode, documentCurrencyCode, buyerReference, …) and eight
> new child tables: `party`, `invoice_line`, `invoice_line_tax_category`,
> `invoice_line_additional_item_property`, `invoice_note`,
> `invoice_additional_document_reference`, `invoice_payment_means`,
> `invoice_tax_subtotal`, `invoice_allowance_charge`.
>
> **Design decisions:**
> - `party` is a **new, separate table** from `organization` — an immutable
>   snapshot of a party's name/address/VAT as they appeared on that specific
>   document (`party.organizationId` optionally links back to the live
>   Organization). Editing an Organization later must never rewrite an
>   already-issued invoice.
> - The SQF lending-workflow fields (funderPersonaId, lendingProduct, the
>   status machine, ownership/settlement timestamps) **stay merged** onto
>   the same `invoice` table alongside the UBL header — one row per invoice,
>   one source of truth. `issuerOrganizationId`/`debtorOrganizationId` (SQF's
>   own org links, used by the relationship/contract graph) exist alongside
>   `supplierPartyId`/`customerPartyId` (the UBL document snapshot) — both
>   point at "the same" party, but serve different purposes and can diverge
>   over time by design.
> - `CreateInvoiceDto` accepts **lines only** — the header LegalMonetaryTotal
>   and per-category tax subtotals are computed server-side
>   (`InvoiceService.buildLinesAndTotals`) from the submitted lines, so
>   stored totals can never drift from the lines that back them.
> - Party snapshots are auto-created from the current Organization record at
>   invoice-creation time (`InvoiceService.snapshotPartyFromOrganization`);
>   the API doesn't yet accept an inline/override party payload (e.g. from
>   document extraction reading a different registered name off the PDF) —
>   noted as a Phase 2.1 follow-up.
>
> DDL: `docs/design/migrations/009-ubl-invoice-schema.sql`. Entities:
> `apps/trade-directory/src/models/{party,invoice,invoice-line,invoice-line-tax-category,invoice-line-additional-item-property,invoice-note,invoice-additional-document-reference,invoice-payment-means,invoice-tax-subtotal,invoice-allowance-charge}.entity.ts`.

### 3.3 (original, pre-UBL) `invoice`

```sql
CREATE TABLE invoice (
  id                      SERIAL PRIMARY KEY,
  "funderPersonaId"       INT NOT NULL,
  "invoiceNumber"         VARCHAR NOT NULL,
  "issuerOrganizationId"  INT NOT NULL REFERENCES organization(id),  -- supplier side
  "debtorOrganizationId"  INT NOT NULL REFERENCES organization(id),  -- buyer side
  "relationshipId"        INT REFERENCES relationship(id),
  "contractId"            INT REFERENCES contract(id),
  "lendingProduct"        VARCHAR,             -- which flow it entered under
  amount                  DECIMAL(15,2) NOT NULL,
  currency                VARCHAR(3) NOT NULL,
  "issueDate"             DATE NOT NULL,
  "dueDate"               DATE NOT NULL,
  status                  VARCHAR NOT NULL DEFAULT 'UPLOADED', -- InvoiceStatusEnum
  "uploadedByPersonId"    INT,
  "sourceDocumentReference" VARCHAR,           -- document-management extraction requestId
  "ownershipTransferredAt" TIMESTAMP,          -- IF: transfer to Funder
  "settledAt"             TIMESTAMP,
  "createdAt"             TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP,
  "updatedAt"             TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP,
  UNIQUE ("funderPersonaId", "issuerOrganizationId", "invoiceNumber")
);
```

`InvoiceStatusEnum` (superset covering all 4 flows):
`UPLOADED → VALIDATED → APPROVED_FOR_FINANCE → PRESENTED (SCF) → FINANCED → PARTIALLY_PAID → PAID → CLOSED`, plus `REJECTED`, `OVERDUE`. Each product flow uses the subset it needs; status transitions enforced in service code.

Who uploads (step 1 mapping): AR/IF → Client uploads own invoices (issuer = Client org). SCF → Buyer (Client persona of the buyer org) uploads approved payables (debtor = Client org, issuer = its suppliers).

### 3.4 `lending_product_subscription`

"A Client is a contracted party to the Funder and has subscribed to 1 or more LP."

```sql
CREATE TABLE lending_product_subscription (
  id                    SERIAL PRIMARY KEY,
  "funderPersonaId"     INT NOT NULL,
  "clientPersonaId"     INT NOT NULL REFERENCES client_persona(id),
  product               VARCHAR NOT NULL,       -- LendingProductEnum
  "facilityContractId"  INT REFERENCES contract(id),
  status                VARCHAR NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE|SUSPENDED|CLOSED
  "createdAt"           TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP,
  "updatedAt"           TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP,
  UNIQUE ("clientPersonaId", product)
);
```

### 3.5 Conventions for all new tables

- Entities in `apps/trade-directory/src/models/`, repositories extend `AbstractRepository<T>`, feature modules with `DatabaseModule.forFeature`.
- Enums in `libs/common/src/apps/trade-directory/enums/` + mirrored in `apps/web/src/constants/enum.ts` (+ proto layer if exposed over gRPC).
- Manual DDL (POSTGRES_SYNCHRONIZE=false) — each phase ships a numbered SQL script under `docs/design/migrations/`.
- Writes that other services care about emit **outbox events** (never direct `kafkaProducer.emit`): `INVOICE_STATUS_CHANGED`, `RELATIONSHIP_UPSERTED`, `CONTRACT_UPSERTED` — these also feed the knowledge graph sync (Phase 4).

---

## 4. Knowledge Graph Service (design now, build in Phase 4)

New service `apps/knowledge-graph` (NestJS) + **Neo4j Community** container in docker-compose (official image, `neo4j:5`, bolt on 7687, browser on 7474). Per-Funder deployment model means one graph per tenant — no cross-tenant leakage risk by construction (consistent with the multi-tenancy governance rules).

### 4.1 Graph schema

Nodes:
| Label | Key attributes | Source of truth |
|---|---|---|
| `Company` | orgId, name, revenue, industry, country, creditRating, isExistingClient, personas | `organization` + personas + KYC report |
| `Individual` | personId/externalId, name, role | `person` now; directors/shareholders later from KYC agency data |
| `Invoice` (FinancialInstrument) | invoiceId, amount, currency, dueDate, status, daysOverdue | `invoice` |
| `Contract` | contractId, type, lendingProduct, value, status | `contract` |

Edges:
| Edge | Properties | Source |
|---|---|---|
| `(Company)-[:SUPPLIES_TO]->(Company)` | paymentTermsDays, yearlyVolumeChangePct, contractValue | `relationship` |
| `(Company)-[:ISSUED_INVOICE]->(Invoice)` / `(Invoice)-[:OWED_BY]->(Company)` | — | `invoice` |
| `(Company)-[:HAS_FACILITY]->(Contract)` | lendingProduct | `contract` (FACILITY_AGREEMENT) |
| `(Company)-[:CLIENT_OF]->(Company:Funder)` | products | `lending_product_subscription` |
| `(Individual)-[:DIRECTOR_OF]->(Company)` | — | future: KYC agency director data |
| `(Individual)-[:HAS_SHARE_IN]->(Company)` | pct | future: UBO/shareholding data |

### 4.2 Sync pipeline

Trade-directory outbox → Kafka topic `SQF_GRAPH_SYNC` → knowledge-graph service consumes with the standard `processed_event` idempotency check → idempotent Cypher `MERGE` upserts. Full-rebuild command (`npx ts-node .../rebuild-graph.ts`) for recovery — the graph is a **projection**, Postgres remains the system of record.

### 4.3 GraphRAG opportunity mining

Three-tier stack per the design doc:
1. **Store:** Neo4j (chosen over Neptune — Neptune has no local-dev story; revisit at AWS rollout, Neo4j runs fine on ECS/EC2 too).
2. **Query generation:** Claude converts natural-language prospecting questions to Cypher (schema-aware prompt, read-only DB user, query allow-listing — the LLM never gets write access).
3. **Synthesis:** Claude (`ANTHROPIC_MODEL`, same env convention as risk-agent/document-management) summarises returned sub-graphs and drafts sales pitches.

Seed opportunity queries (from the doc, shipped as named saved queries, not free-form only):
- **SCF anchor:** high-credit buyers, revenue > threshold, ≥3 small suppliers on ≥60-day terms.
- **IF via cross-directorship:** suppliers with >£250k outstanding overdue invoices whose director also sits on an existing-client company (needs DIRECTOR_OF data — degraded version without it: outstanding-invoice volume only).
- **TL expansion:** suppliers with >25% YoY volume growth and no existing term-loan facility.

API sketch: `GET /knowledge-graph/opportunities/:queryName`, `POST /knowledge-graph/query` (NL → Cypher → results + summary), both Funder-scoped, Super-Admin/sales-role access documented per the RBAC-comment convention (no new hardcoded CASL rules).

---

## 5. Frontend Redevelopment (Phase 3)

Terminology sweep (Factor→Funder, Contract Awarder→Buyer, Experian→KYC agency labels) lands in Phase 1 with the renames. Phase 3 is the new screens, all Mantine + design-system theme (no new hardcoded hex):

1. **Trade Directory home** — searchable organization directory with persona badges (Client / Supplier / Buyer matrix per the doc's table), status, region.
2. **Organization profile** — tabs: Overview (existing data + KYC agency snapshot), **Personas**, **Relationships** (graph-adjacent list: supplies-to / supplied-by with payment terms), **Contracts**, **Invoices**.
3. **Relationship management** — create/edit SUPPLIES_TO links between orgs (feeds directly into SCF/IF flows and the KG).
4. **Invoice register** — per-product upload flows (step 1 of each LP flow), status timeline matching `InvoiceStatusEnum`, link to document-management extraction where the invoice doc was parsed.
5. **Contracts register** — facility agreements per client + commercial contracts per relationship.
6. **Client subscriptions** — which LPs each client is signed up for.
7. **(Phase 4) Opportunities screen** — saved GraphRAG queries + results with pitch drafts.

Routes under `apps/web/src/constants/routes.tsx`; React Query hooks in `hooks/`, raw calls in `service/` per convention.

---

## 6. Build Plan (step-by-step)

| Phase | Scope | Touches |
|---|---|---|
| **0** | Remove LCM legacy subsystem (see `lcm-removal-assessment.md`) — shrinks every Phase 1 rename | all services + web |
| **1a** | Rename Contract Awarder → Buyer (entities, module, DDL, transaction relations, frontend labels) | trade-directory, risk-operation, web, libs/common |
| **1b** | Rename Experian → KYC Agency (entities, modules, enums, Kafka topics, org columns, DDL, frontend) | trade-directory, risk-operation, web, libs/common |
| **1c** | Rename Factor → Funder (global: entities, tenant key, proto, seeds, DDL in every DB, frontend) | all services + web |
| **1 gate** | All 5 services healthy, login + org screens + application flow E2E against real infra (no mocks) | — |
| **2a** | `relationship` table + module + CRUD API + outbox events | trade-directory |
| **2b** | `contract` + `lending_product_subscription` tables + modules + APIs | trade-directory |
| **2c** | `invoice` table + module + per-product status machine + upload API + outbox events | trade-directory |
| **2 gate** | E2E seed → create relationships/contracts/invoices through API, events observed on Kafka | — |
| **3** | Frontend: directory home, org profile tabs, relationship mgmt, invoice + contract registers, subscriptions | web |
| **4** | Neo4j in compose, knowledge-graph service, SQF_GRAPH_SYNC consumer, rebuild script, GraphRAG API, opportunities UI | new app + web |

Each sub-phase is independently committable and leaves the platform healthy (session-start health check passes).

Ordering rationale: 1a/1b are small and self-contained warm-ups; 1c is the wide one and goes last within Phase 1 so the diff is isolated. Phase 2 tables build on the renamed taxonomy (buyer/funder columns from day one). KG (4) needs Phase 2's tables populated to be worth standing up.

---

## 7. Out of scope / explicitly deferred

- Dynamic RBAC / role_permission — separate planned work (CLAUDE.md); new endpoints here get access-comments only. Note: the planned `role_permission.factorPersonaId` column design should read `funderPersonaId` after 1c.
- Director/shareholder (Individual) graph data — needs a KYC agency data feed that doesn't exist yet; KG schema reserves the node/edge types.
- Payment/settlement legs of the LP flows (steps 4–7) — belong to the future payment/finance services; invoice status enum reserves the states.
- Legacy `transaction` table (bank-statement style, persona-linked) — untouched except relation renames; folding it into the new model is a later decision.
