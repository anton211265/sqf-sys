# SQF — Claude Code Reference

## Working Agreement (Tony, 2026-07-12)

Claude is authorized to run **all scripts and commands without asking for approval first** — builds, seeds, DB migrations/DDL, docker compose operations, service restarts, and test runs included. The same applies to executing the phases of an agreed plan: no per-step confirmation. Verification gates (typecheck, 6-service health check, E2E against real infra) replace check-ins. Still surface — rather than silently execute — anything that is genuinely new scope, contradicts the agreed design, or destroys data/work outside the plan.

**Conflicts between documented/claimed architecture and actual code must be checked with Tony, not silently resolved either way** (added 2026-07-16, after a concrete incident — see below). When something Claude wrote (a doc, a training artifact, an earlier claim in conversation) turns out to disagree with what the running code actually does, that disagreement gets surfaced and confirmed with Tony before landing a fix — don't just pick the side that seems more likely correct and proceed. This matters because both directions of error are easy: the doc/claim can be wrong, but so can Claude's reading of the code, and only Tony has the full context on which the system was actually supposed to do.

*Incident that prompted this:* the trade-directory training walkthrough said an organisation gets "no persona" if it's merely named on an invoice — backwards; per `InvoiceTradeNetworkService.ensureTradeNetwork`, being named as issuer/debtor on an invoice always assigns a Supplier/Buyer persona. Fixing the doc surfaced a real code inconsistency: `RelationshipService.create()` (the manual "+ New relationship" path) saved relationships without ever assigning personas, unlike the invoice path — confirmed live (`SUMMERSCAPE` had a `SUPPLIES_TO` relationship row but `supplierPersonaId IS NULL`). Fixed by extracting persona assignment into a shared `PersonaAssignmentService` (`apps/trade-directory/src/persona/`) used by both `InvoiceTradeNetworkService` and `RelationshipService`. The lesson isn't the specific bug — it's how easily a stale doc, a plausible-sounding claim, and an actual code gap can all look the same from the outside until someone checks the live data.

## Session Start Checklist

At the start of every session, verify all 6 microservices are healthy before doing any work:

```bash
for svc in trade-directory risk-operation customer-relationship-management document-management notification knowledge-graph; do
  echo -n "$svc: "; curl -s -o /dev/null -w "%{http_code}\n" http://localhost/$svc/
done
```

All should return `404`. A `502` means the service's HTTP server is down (check `docker compose logs <service-name> --tail=50` for webpack/TypeScript errors). A `000` means the container itself is not running.

---

## What This Is

SQF is a financial platform (supply-chain finance / invoice factoring) built as an Nx monorepo. It has 6 NestJS microservices and a React/Vite frontend.

---

## Monorepo Structure

```
sqf-sys/
├── apps/
│   ├── trade-directory/        # Auth, orgs, persons, JWT login, system setup
│   ├── risk-operation/         # Loan applications, risk scoring, KYC agency reports
│   ├── customer-relationship-management/  # Client assignees
│   ├── document-management/    # Document extraction, webhooks, API keys
│   ├── notification/           # Email sending (Kafka consumer)
│   ├── knowledge-graph/        # Neo4j projection of the trade network + GraphRAG opportunities
│   └── web/                    # React + Vite frontend (src/ inside)
├── libs/
│   └── common/                 # Shared entities, guards, decorators, enums, proto
├── docker-compose.yml
└── package.json                # Root — all deps merged here (Nx monorepo)
```

Each microservice has its **own PostgreSQL database**. Services communicate via **Kafka**.

---

## Running Locally

### Start backend (Docker)
```bash
docker compose up -d
# Wait ~30-40s for webpack builds to finish
docker compose ps   # all should be Up
```

### Start frontend (Vite, separate from Docker)
```bash
npm run serve:web          # http://localhost:3001
# Or background:
npm run serve:web > /tmp/vite.log 2>&1 &
```

### Stop
```bash
docker compose down        # keeps Postgres/Kafka data in volumes
```

### Restart a single service after code changes
```bash
docker compose restart trade-directory-service
# Wait ~15s for webpack hot rebuild, then check:
docker compose logs trade-directory-service --tail=10
```

### Health check all services
```bash
for svc in trade-directory risk-operation customer-relationship-management document-management notification knowledge-graph; do
  echo -n "$svc: "; curl -s -o /dev/null -w "%{http_code}\n" http://localhost/$svc/
done
```
All should return 404 (no route at `/` is correct — means the service is up).

### Known boot issue
On a fresh Kafka boot, a service may crash with `KafkaJSProtocolError: UNKNOWN_TOPIC_OR_PARTITION`. Fix: `docker compose restart <service-name>` once — topics auto-create on retry.

**Different from the above:** if *every* service is crash-looping with `KafkaJSConnectionError: getaddrinfo ENOTFOUND kafka`, the `kafka` container itself has likely exited (check `docker compose ps kafka`) — `docker compose up -d kafka` first, then restart the dependent services. See "Backend changes required to support a second frontend origin" under "Planned: Frontend Rebuild" for the full container-ops notes (this + the `.env`-doesn't-reload-on-`restart` and nginx-IP-caching gotchas) surfaced while standing up `apps/web-next`.

---

## Key Commands

### Run seed script (SQFSYS bootstrap account + enrollment link)
```bash
docker compose exec trade-directory-service \
  npx ts-node -r tsconfig-paths/register \
  apps/trade-directory/src/scripts/seed-funder.ts
```
Creates the SQFSYS account (`tony.murphy@synlian.net`) if missing and **prints a
one-time passkey enrollment URL (24h, single use) on every run** — there is no
password. Re-running on an existing account just issues a fresh link, never
touches registered credentials, so this is also the SQFSYS lost-device
recovery path.

### Issue a passkey enrollment link for any existing user
```bash
docker compose exec trade-directory-service \
  npx ts-node -r tsconfig-paths/register \
  apps/trade-directory/src/scripts/issue-enrollment-token.ts <email>
```
Out-of-band bootstrap/recovery for any person row (e.g. `admin@sqf.local`, or a
user who lost all devices when no SUPERUSER is around to use
`POST /auth/passkey/enrollment-tokens`). Prints a one-time `/enroll#token=...`
URL, valid 24h.

### Backfill missing relationship personas (one-off, idempotent)
```bash
docker compose exec trade-directory-service \
  npx ts-node -r tsconfig-paths/register \
  apps/trade-directory/src/scripts/backfill-relationship-personas.ts
```
Fixes existing `SUPPLIES_TO` relationships created before the 2026-07-16 `RelationshipService` persona-assignment fix (see Working Agreement above). Safe to re-run — no-ops on organizations that already have the persona.

### Manual DB migration (POSTGRES_SYNCHRONIZE=false for all services)
```bash
docker compose exec postgres psql -U postgres -d "trade-directory" \
  -c "ALTER TABLE person ADD COLUMN IF NOT EXISTS system_role VARCHAR;"
```
Replace `trade-directory` with the target DB name, and the SQL with whatever DDL is needed.

### Connect to a service's DB
```bash
docker compose exec postgres psql -U postgres -d "trade-directory"
docker compose exec postgres psql -U postgres -d "risk-operation"
# etc.
```

---

## Architecture

### Auth Flow (WebAuthn passkeys — passwords removed 2026-07-22)
1. `POST /trade-directory/auth/organizations` — returns orgs for the email (unchanged)
2. `POST /trade-directory/auth/passkey/login-options` `{ email, orgId }` — membership pre-check, returns `{ loginSessionId, options }` (server-side challenge, 2-min TTL, single-use)
3. Browser `startAuthentication(options)` → `POST /trade-directory/auth/passkey/login-verify` `{ loginSessionId, response }` — verifies the assertion (`userVerification: 'required'`, signature counter persisted for clone detection), returns `{ accessToken }` + sets the httpOnly `refresh_token` cookie
4. `GET /trade-directory/api/person/me` — unchanged; refresh/logout/rotation/audit flows unchanged (passkey login calls the same `AuthService.issueSession`)

**Password login is gone**: `POST /auth/login`, `/auth/reset`, `/auth/dummy-login` removed; `person.password` column retained but unused. Microsoft SSO (MSAL) was already removed. The dormant Kafka invite flow (`SqfOrganizationPersonService`) still writes `reset_password_token` rows that nothing can redeem — convert it to enrollment tokens if it's ever revived.

**Enrollment (first passkey)** — the only way into an account with no credential:
- `POST /auth/passkey/register-options` `{ enrollmentToken }` + `register-verify` → `/enroll#token=...` screen in both frontends (token rides in the URL fragment, never in server logs; 24h, single-use, sha256-hashed at rest in `enrollment_token`)
- Issued by: seed scripts (`seed-funder.ts` prints a fresh SQFSYS link on every run — that's the SQFSYS recovery path; `issue-enrollment-token.ts <email>` for anyone else), the SystemSetup initialize response (Super Admin gets an `enrollmentUrl` instead of a password), or `POST /auth/passkey/enrollment-tokens` (SQFSYS or SUPERUSER-of-own-org only — Super Admin intent, direct check pending Dynamic RBAC)
- Add-device mode: `register-options` with a Bearer token instead of an enrollment token
- Management: `GET/PATCH/DELETE /auth/passkey/credentials[/:id]` — soft-revoke (`revokedAt`), revoking the last active credential is blocked (400)

**QR cross-device login (Tier 3)** — for desktops with no usable authenticator; browser-native hybrid (Chrome/Safari's own QR) is preferred and needs none of this:
1. Desktop: `POST /auth/qr/initiate` → `{ qrSessionId, loginUrl }` (60s TTL, single-attempt pin in the URL fragment), renders QR, listens on WS `/trade-directory/auth/qr/ws?qrSessionId=...` (nginx has a dedicated upgrade location)
2. Phone (already signed in) scans → `/mobile-auth?session=...#pin=...` → `POST /auth/passkey/reauth-options` (JWT) + fresh assertion → `POST /auth/qr/authorize-mobile` `{ qrSessionId, pin, reauthSessionId, response }` — wrong pin kills the session; IP/device-type metadata checks are strict in production, warn-only in dev (QRLjacking mitigation)
3. Desktop WS receives a one-time **auth code only — never tokens** (an httpOnly cookie cannot be set over a WS); `POST /auth/qr/complete` `{ qrSessionId, authCode }` mints the desktop its **own** token pair (fresh family) and sets the refresh cookie. The phone's tokens are never shared.

**Implementation notes:** `@simplewebauthn/server`+`/browser` pinned to **v9** (v10+ needs Node 20; containers run Node 18). Challenges/QR sessions live in in-memory TTL maps (`TtlMap`) — single-instance dev only, Redis is a production/Terraform concern. `rpID` defaults to `localhost` (env `WEBAUTHN_RP_ID`), `expectedOrigin` derives from `FRONTEND_DOMAIN` (override `WEBAUTHN_ORIGINS`), QR link base = first `FRONTEND_DOMAIN` origin (override `QR_LOGIN_BASE_URL`) — production needs all three set to the real HTTPS domain. New audit events: `PASSKEY_REGISTERED/…_FAILURE/…_LOGIN_SUCCESS/…_LOGIN_FAILURE/…_REVOKED`, `ENROLLMENT_TOKEN_ISSUED`, `QR_LOGIN_INITIATED/APPROVED/REJECTED/COMPLETED`. Key files: `apps/trade-directory/src/auth/passkey/` (service, QR service, controller, `ttl-map.ts`), `guards/bearer-context.guard.ts` (JWT guard that accepts SQFSYS orgId 0, unlike passport `JwtAuthGuard`), migration `1784600000000-PasskeyAuth.ts` (`webauthn_credential`, `enrollment_token`).

**E2E regression guard:** `node apps/trade-directory/src/scripts/e2e-passkey.mjs` (host, Node ≥22) — software authenticator (real P-256/CBOR/DER) driving all endpoints through nginx incl. the WS handshake, replay/clone/pin-abuse negatives, and audit-trail assertions; creates and removes its own test identity. Note: editing anything under `apps/trade-directory/src` (this script included) triggers a webpack-watch rebuild — the script waits for the service to come back before testing. Passkeys with required user verification satisfy the MFA go-live line for login; TOTP step-up for disbursement approval remains open.

Frontend uses two axios clients, both JWT-cookie-based:
- `axiosClient` (`apps/web/src/api/axiosClient.ts`) — used by Login, SystemSetup, and the login/logout services. Reads `access_token` from cookies, retries once on 401 via `/trade-directory/auth/refresh`, and redirects to login if refresh fails.
- `apiClient` / `publicClient` (`apps/web/src/utils/reactQuery.ts`) — same cookie + refresh pattern, used by the SQF screens. Kept as a separate client rather than merged with `axiosClient` to avoid a cross-cutting refactor; both should stay behaviorally in sync if either's refresh logic changes.

The legacy LCM subsystem (pre-SQF loan-case-management screens and backend modules) was fully removed on 2026-07-12 — see docs/design/lcm-removal-assessment.md for what went and what was deliberately kept.

### SQFSYS System Role
- `tony.murphy@synlian.net` / `Hann@h12` — platform-level system administrator
- Has `system_role = 'SQFSYS'` in the `person` table (no org membership)
- Login returns sentinel org `{ id: 0, name: 'SQF System' }` — org dropdown is hidden
- After login, frontend redirects to `/system-setup`
- `SystemSetupGuard` (not `AuthGuard`) protects the initialize endpoint — verifies JWT directly without requiring `funderPersonaId`
- SQFSYS creates the Funder Organization and first Super Admin through the UI
- **Initialization scope is deliberately narrow (confirmed 2026-07-17):** SQFSYS only sets Funder Org + Super Admin parameters. Everything else — roles, `role_permission` rows, product/lending configuration, etc. — starts empty/reset; the appointed Super Admin must configure all of it via their own Super Admin portal (see "Planned: Dynamic RBAC, Multi-Tenancy and Role-Based Dashboard" below). SQFSYS does not seed defaults for any of it.
- In production, Funder initialization happens through the **SQFSYS Admin Portal** (see "Planned: SQFSYS Admin Portal" below), not this dev-only `/system-setup` screen — that screen assumes a single shared deployment; production provisions a new isolated Funder deployment per subscription.

### Route Guards (frontend)
- `PrivateRoute` (defined in `apps/web/src/App.tsx`) — checks JWT `refresh_token` cookie. The only route guard in the app; use for every protected route.
- `ProtectedRoute` (MSAL-based) has been removed along with Microsoft SSO. Routes that used it now use `PrivateRoute` wrapped in `<Layout>` directly (the `Layout` wrapping `ProtectedRoute` used to provide automatically).

### POSTGRES_SYNCHRONIZE
Set to `false` in all services. New entity columns **do not auto-create**. Always write a DDL migration and run it manually before running seeds or deploying.

---

## Messaging Architecture (Kafka)

**Rule: Never call `kafkaProducer.emit()` directly.** Always use the transactional outbox pattern.

### Publisher side
Write an `outbox_event` row in the **same DB transaction** as the business change. A relay cron job (`OutboxRelayService`) polls every 5 seconds and emits to Kafka.

### Consumer side
Before processing any Kafka message, check `processedEventRepository.exists(eventId)`. If already processed, skip. Otherwise process + insert `processed_event` row in the same transaction.

### Entities (libs/common)
- `OutboxEvent` — `libs/common/src/database/outbox-event.entity.ts`
- `ProcessedEvent` — `libs/common/src/database/processed-event.entity.ts`

### Kafka topic roles per service
| Service | Publishes | Consumes |
|---|---|---|
| risk-operation | SEND_EMAIL | DOCUMENT_EXTRACTED (FINANCIAL_STATEMENTS → financial_credit_report) |
| trade-directory | RECEIVE_KYC_REPORT, SEND_EMAIL, ORGANIZATION_CREATED, DOCUMENT_VALIDATION_DATA | REQUEST_KYC_REPORT, DOCUMENT_EXTRACTED (COMPANY_REGISTRY → org snapshot reply), INVOICE_EXTRACTION_VALIDATED (→ InvoiceService.create) |
| customer-relationship-management | — | CREATE_CLIENT_ASSIGNEE |
| notification | — | SEND_EMAIL |
| document-management | DOCUMENT_EXTRACTED, INVOICE_EXTRACTION_VALIDATED | DOCUMENT_VALIDATION_DATA |
| knowledge-graph | — | RELATIONSHIP_UPSERTED, CONTRACT_UPSERTED, INVOICE_STATUS_CHANGED |
| risk-agent | — | APPLICATION_SUBMITTED_FOR_REVIEW, ORGANIZATION_CREATED |

Dormant since the LCM removal (2026-07-12): nothing currently publishes REQUEST_KYC_REPORT or CREATE_CLIENT_ASSIGNEE, and nothing consumes RECEIVE_KYC_REPORT — the old producers/consumers lived in the deleted LCM modules. The trade-directory redesign (docs/design/trade-directory-redesign.md) re-introduces the triggers; the topics and trade-directory's KYC consumer are kept.

Every Kafka message type must have `eventId: string` at the top level.

### Trade network & knowledge graph (built 2026-07-13)

The trade-directory redesign (docs/design/trade-directory-redesign.md) is implemented:
- **Tables** (trade-directory DB): `relationship` (directional SUPPLIES_TO), `contract` (FACILITY_AGREEMENT | COMMERCIAL), `invoice` (status machine in `invoice.service.ts` — keep `InvoiceStatusTransitions` in `apps/web/src/constants/enum.ts` in sync), `lending_product_subscription`. All writes emit outbox events (topics above).
- **`invoice` mirrors OASIS UBL 2.5** (2026-07-13, source `SQF ARCHITECTURE/SCEHMA/ubl-invoice-*`): header carries the UBL LegalMonetaryTotal (lineExtensionAmount/taxExclusiveAmount/taxInclusiveAmount/payableAmount — no more flat `amount`/`currency`) plus SQF lending fields (funderPersonaId, lendingProduct, status machine) on the same row. New tables: `party` (immutable per-document snapshot of supplier/customer, separate from `organization`, optional `organizationId` link), `invoice_line` (+ `invoice_line_tax_category`, `invoice_line_additional_item_property`), `invoice_note`, `invoice_additional_document_reference`, `invoice_payment_means`, `invoice_tax_subtotal`, `invoice_allowance_charge`. `CreateInvoiceDto` takes **lines only** — `InvoiceService.buildLinesAndTotals` computes all totals/tax-subtotals server-side so they can't drift from the lines. Party snapshots auto-generate from the Organization at create time. See docs/design/trade-directory-redesign.md §3.3.
- **APIs**: `/trade-directory/api/relationships|contracts|invoices|lending-product-subscriptions|trade-directory/organizations` — JwtAuthGuard'd, tenant-scoped by resolving `funderPersonaId` from the caller's org (403 if the caller's org is not a funder).
- **Frontend**: `apps/web/src/screens/SQF/TradeDirectory/` under `/directory/*` routes (NOT `/trade-directory/*` — that prefix belongs to the Vite dev proxy). Nav group "Trade Directory" in AdminLayout.
- **knowledge-graph service**: consumes the three trade-network topics, projects them into Neo4j (`neo4j:5` in compose, browser at http://localhost:7474, bolt 7687, auth neo4j/sqfgraph). Graph is a projection — rebuild any time with `docker compose exec knowledge-graph-service npx ts-node -r tsconfig-paths/register apps/knowledge-graph/src/scripts/rebuild-graph.ts`. Idempotency via ProcessedEvent nodes (graph-side equivalent of processed_event). Opportunities API `/knowledge-graph/api/opportunities` (3 saved GraphRAG queries; `POST .../query` NL→Cypher needs ANTHROPIC_API_KEY in apps/knowledge-graph/.env, off by default).
- Dev test user for the funder-scoped APIs/screens: `admin@sqf.local` / `Test@1234`, orgId 2.

### Planned: Business Analyst AI Agent — external RAG for opportunity discovery (noted 2026-07-18)

Tony's design note: beyond the internal-graph-only saved opportunity
queries (`scf-anchor`, `invoice-factoring`, `term-loan-growth` —
above), a **Business Analyst AI Agent** will use RAG over external
internet sources tied to organisations already in a Funder's trade
network (Client/Supplier/Buyer) to surface financing opportunities the
internal graph alone can't see. Examples Tony gave: Company A (Client)
publicly announces a yearly loss → may need a term loan; Company B
(Client) announces a strategic procurement contract with Company C
(Client) → possible SCF opportunity between them.

**Status:** design note only, 2026-07-18 — not built, no architecture
decided. Distinct from two things it could be confused with: (1) the
existing GraphRAG opportunities queries above, which only ever read
data already inside Neo4j; (2) the SQFSYS Admin Portal's "prospects
for funders" Knowledge Portal item (see "Planned: SQFSYS Admin
Portal") — that one is Synlian sourcing new *Funder* customers across
deployments, this is a per-Funder agent surfacing new *lending*
opportunities among a Funder's own existing clients.

**Open — not yet decided:**
- Whether this lives as a new capability inside the existing
  `knowledge-graph` service/opportunities API, a new standalone agent
  (parallel to `risk-agent`), or an extension of `risk-agent` — the
  only AI-agent codebase that exists today.
- Which "Sales & Customer Management" domain product agent (already
  named in "Multi-Tenancy & Data Governance" below) this maps to, if
  any.
- Data-sourcing mechanics: which external sources, how orgs already in
  the trade graph get matched to external mentions, whether results
  get written back into Neo4j as new node/edge types or surfaced
  separately.
- Tenant-isolation implications: per the per-Funder deployment
  isolation model, this needs to run scoped to one Funder's own
  organisations per deployment, not a shared external-RAG pipeline
  crossing Funders.

### Document tables (built 2026-07-14)

Two S3-backed document tables live in trade-directory, both entities in `apps/trade-directory/src/models/`:
- **`person_supporting_document`** — reintroduced (existed in the original 2024 schema — NRIC scan → S3 `bucketKey` — dropped during the 2026-07-13 redesign, brought back verbatim). `personId` FK → `person`, `supportingDocumentType` enum (`PersonSupportingDocumentTypeEnum`, currently just `NRIC`).
- **`organization_document`** — new. Org-level artefacts (`OrganizationDocumentTypeEnum`: business registration cert, tax registration cert, audited financials, bank statement, company profile, other), `organizationId` FK → `organization`, S3 pointer (`bucketName`/`objectKey`/`fileName`/`mimeType`/`fileSizeBytes`), optional `uploadedByPersonId` FK → `person`.

Both are registered in `trade-directory.module.ts`'s `DatabaseModule.forFeature` + `providers` (repository only, following the `KycAgencyReportRepository` pattern — **no service/controller/API yet**, so there's no upload endpoint or actual S3 client wiring. Build that as its own task when the document-upload UI is scoped, reusing the S3 patterns.

### Auto-created organizations + Risk Agent KYC pickup (built 2026-07-14)

`POST /trade-directory/api/invoices` can now auto-create a bare `Organization` for an issuer/debtor that doesn't exist yet: `issuerOrganizationId`/`debtorOrganizationId` are optional, and an inline `newIssuerOrganization`/`newDebtorOrganization` (`NewOrganizationDto` — only `organizationName` required) can be supplied instead. Exactly one of {id, inline-new-org} is required per side. Before creating, it dedups by `businessRegistrationNumber` when given, else falls back to exact `organizationName` match (same weaker check the dormant `SQF_CREATE_ORGANIZATION` Kafka handler already uses) — there is **no DB unique constraint backing this**, so it's correct for the realistic sequential case but not a concurrency guarantee (see `InvoiceTradeNetworkService.resolveOrCreateOrganization`). A newly-created org emits `ORGANIZATION_CREATED` (payload: `organizationId`, `organizationName`, `businessRegistrationNumber`, `country`, `source: 'invoice_issuer' | 'invoice_debtor'`, `funderPersonaId`) — only on genuine insert, never on a dedup-matched reuse. `fullyOnboardedAt` stays null, same as every org today.

**The Risk Agent now consumes `ORGANIZATION_CREATED` and runs a KYC-intake task on every newly added organization (built 2026-07-14).** `apps/risk-agent/src/organization-kyc/` — `OrganizationKycController` (`@EventPattern(KafkaTopicEnum.ORGANIZATION_CREATED)`, idempotent via `ProcessedEventRepository`, same pattern as `QueueController`) hands off to `OrganizationKycService.runKycCheck`, which calls `RiskAgentService.runOrganizationKycTask` — a parallel, purpose-built LLM tool-use loop (separate from the application-review `runTask`, since that one requires an `applicationId`/`applicationNumber` baked into `NOT NULL` DB columns with no organization-only path). The task calls `check_compliance` and `get_financial_credit_report` (already organization-scoped, reused unchanged) and must conclude by calling the new `propose_organization_kyc_outcome` tool, which persists a `CLEAR`/`FLAGGED` outcome + confidence + reasoning to a new `organization_kyc_recommendation` table (`apps/risk-agent/migrations/002-organization-kyc.sql`) — same shadow/suggest-mode philosophy as application review: the agent never clears or flags an org itself, a Human Risk Analyst confirms or overrides via `PATCH /api/crc-dashboard/organization-kyc/:id/resolve`.

**Known limitation, not fixed:** a KYC task that errors or exhausts its 8-turn cap without proposing an outcome leaves no persisted trace — mirrors an existing accepted gap in the application-review `runTask` (a failed task there also only logs), not a new regression, but worth tightening later if it needs a "processing failed" signal on a dashboard.

**Why:** an invoice naming an unknown counterparty (a client's supplier, or Companies D/E/F/G under an SCF facility) shouldn't be blocked just because that org has no directory record yet — but a bare, auto-created record has had zero KYC, so it needs a real trigger to get vetted rather than silently sitting unreviewed.
**How to apply:** resolving a KYC recommendation via `PATCH /api/crc-dashboard/organization-kyc/:id/resolve` only updates risk-agent's own audit trail — trade-directory's `Organization` has no verification/KYC status field to write back to today. If the directory UI ever needs to show KYC status on the org record itself, that's a new field + a Kafka event from risk-agent back to trade-directory, not built.

### Bank account data belongs to the Payment service, not trade-directory (decided 2026-07-14)

A `bank_account` table existed in trade-directory's original 2024 migration but was dropped during the 2026-07-13 redesign and never carried forward — this was correct and should stay that way. When the Payment microservice (see "Domain structure" → Finance below, and `agents/` product-agent docs) gets designed and built, bank account details (account holder, bank, account number, SWIFT/branch codes, verification status) belong there, not in trade-directory.

**Why:** bank accounts are disbursement/settlement targets with their own verification lifecycle (e.g. penny-drop checks) — that's Payment's job, not trade-directory's (identity, KYC, and the trade graph). Putting it here would couple an identity service to payment-specific compliance logic it shouldn't own.
**How to apply:** Payment references organizations/persons by bare `organizationId`/`personId` int, same pattern already used by risk-operation and customer-relationship-management — no cross-DB FK. If the directory UI needs to show bank-verification status alongside org profile data, use a Kafka event (e.g. a future `BANK_ACCOUNT_VERIFIED`) rather than a shared table or synchronous cross-service read on every page load.

### Planned: Payment microservice — pain.001 scoping (noted 2026-07-18, paused)

Tony provided an ISO 20022 `pain.001.001.09` (Customer Credit Transfer
Initiation) schema/example/data-dictionary as the starting design
input for the Payment microservice — source files at `SQF
ARCHITECTURE/SCEHMA/pain001-payment-{schema.json,example.json,data-dictionary.md}`
(sibling directory to this repo, same convention as the UBL invoice
schema source noted under "Trade network & knowledge graph" above).
The data dictionary normalizes it into `payment_message` →
`payment_batch` → `payment_transaction` →
`payment_transaction_remittance_line` (+ `payment_status_history` as
an application-only audit-trail extension, not part of the ISO
standard), with a `status` lifecycle: `DRAFT → PENDING_APPROVAL →
APPROVED → SUBMITTED → ACCEPTED/REJECTED → SETTLED/CANCELLED`.

**Confirmed buildable as a Deterministic Service** (per AGENT.md's own
classification of Payment — "until it needs to reason about ambiguous
cases beyond verifying approved terms"): this schema is message
construction, a fixed state machine, and an audit trail — no LLM
judgment required for its core function. The decision to pay is made
upstream (by a human or the Finance & Accounting Agent); Payment only
builds, submits, and tracks an already-approved instruction.

**Status: scoping paused 2026-07-18** — design to be completed
together in a future session. Tony will capture the full detail in
the pending platform-wide architecture blueprint (see "Architecture
blueprint pending" in project memory) rather than iterating further
here piecemeal.

**Six open items to resolve before/while building** (raised
2026-07-18, not yet answered):
1. **Scope boundary** — this schema only covers outbound disbursement
   (money going out). Inbound repayment/collections/cash-application
   (a debtor repaying a factored invoice) is a separate, currently
   unscoped gap — same one already flagged in the Oracle OBSCF manual
   comparison above. Confirm this build pass is outbound-only.
2. **Trigger mechanism** — does something call a synchronous API
   (e.g. the Finance & Accounting Agent calling `POST /payments`), or
   does Payment consume a Kafka trigger event (e.g. a future
   `DISBURSEMENT_APPROVED`) via the existing outbox pattern, or both?
3. **Approval step** — who/what transitions `PENDING_APPROVAL →
   APPROVED`: a human Finance Officer via UI (ties into the
   maker-checker idea from the Oracle OBSCF review and the in-flight
   Dynamic RBAC work), the Finance & Accounting Agent itself, or a
   mix depending on amount/risk thresholds?
4. **Submission channel realism** — `ApplicationMetadata.channel`
   allows SFTP/API/SWIFT, but there's no real banking partner/sandbox
   identified yet. Build a stubbed/mock submission adapter first
   (same spirit as the `PENDING_REVIEW` human-gate pattern used for
   vision-LLM document extraction), or is there an actual integration
   target?
5. **Outbound Kafka events** — once a payment settles/is rejected,
   other services need to know (trade-directory marking an invoice
   `PAID`, notification emailing someone, knowledge-graph projecting
   it). Topic names (e.g. `PAYMENT_SETTLED`, `PAYMENT_REJECTED`) not
   yet decided.
6. **Tenant scoping** — same `funderPersonaId` pattern as every other
   service, or something different given Payment is the one service
   that actually touches bank rails per-Funder?

### Related-party attributes (director, shareholder, product, ...) are a graph-computed pattern, not a `relationship` row (decided 2026-07-14)

Shared director, shared shareholder, same lending product, and other common-attribute links between two organizations are **not** modeled as rows in the Postgres `relationship` table. `RelationshipTypeEnum` stays limited to the directional trade type it already has (`SUPPLIES_TO`); its own code comment already anticipated this — `SUBSIDIARY_OF`/`SHARES_DIRECTOR_WITH` are marked "reserved for later (knowledge-graph driven)". This decision confirms and generalizes that: any "these two orgs are connected because they share X" fact is a **computed graph pattern in knowledge-graph (Neo4j)**, discovered by querying the projected data, not an explicit row anyone inserts.

**Why:** `relationship.fromOrganizationId`/`toOrganizationId` model a directional trade flow (supplier→buyer) — a shared director or shareholder is symmetric, so it doesn't fit that shape without either faking a direction or double-storing the pair. There's also no reliable trigger moment for it the way invoice creation states issuer/debtor directly: a shared director is *derived* by joining `OrganizationPerson` rows across two `organizationId`s, and `OrganizationPerson.designation` is free text today (`"Director"`, `"Managing Director"`, ...), not a structured field — no create()-time hook to hang this on. And it's a related-party/conflict-of-interest signal (Bank Negara relevance), not a trade fact, so it shouldn't silently look like one in the trade graph.

**How to apply:** when this gets built, it means (1) projecting `Person` nodes and `Person -[:MEMBER_OF {designation}]-> Company` edges into Neo4j (trade-directory doesn't currently emit any event when `OrganizationPerson` rows change — a new topic/consumer would be needed, mirroring the existing `RELATIONSHIP_UPSERTED`/`CONTRACT_UPSERTED`/`INVOICE_STATUS_CHANGED` pattern), (2) structuring shareholder data as real entities/edges rather than the free-text/jsonb blob currently buried in `KycAgencyReport.shareholders`, and (3) projecting `LendingProductSubscription` so "same product" is a graph pattern too. The actual "shared director" fact is then a Cypher query (e.g. two `Company` nodes reachable from the same `Person` node via `MEMBER_OF`), exposed through the existing GraphRAG opportunities API pattern (`apps/knowledge-graph/src/opportunities/`) — not a new Postgres migration. Not built yet; this is a design decision only.

### Oracle OBSCF manual — reference for closing invoice/relationship gaps (2026-07-17)

[`oracleAR.md`](oracleAR.md) (repo root) is Oracle Banking Supply Chain
Finance (OBSCF) Release 14.7's Receivables & Payables user guide — a
closer domain match than generic Oracle AR, since OBSCF is itself an
SCF/factoring product. Reviewed 2026-07-17 and compared against
trade-directory's current invoice/relationship/party model. **Status:
gaps identified, on hold — not being built now, revisit as the
Dynamic RBAC / Super Admin portal / dashboard work and any future
Payment service design progress.** Use `oracleAR.md` as an ongoing
reference whenever touching this domain, not just a one-time read.

Gaps worth adopting, grouped by what they need:

- **Fits the existing schema, no new service required:** dispute
  lifecycle (raise/resolve/write-off, dispute amount, dispute code —
  currently absent from `InvoiceStatusEnum`); aging buckets /
  days-overdue (no concept of this today); relationship-level policy
  fields (Oracle's `relationship` record carries auto-acceptance days,
  overdue-handling policy, excess-payment handling, holiday treatment
  — ours only has `paymentTermsDays`, volume stats, currency, status);
  bulk invoice/relationship upload via CSV (currently one-at-a-time
  only); aging/dispute-triggered notifications (new outbox event
  types into the existing Kafka+notification pattern).
- **Real design fork, needs Tony's call before building — not a pure
  schema question:** Credit Note / Debit Note as functioning
  instrument types. UBL already has a `CREDIT_NOTE` type code in
  `InvoiceTypeCodeEnum` but nothing uses it (no adjustment reason, no
  link back to the original invoice); there's no debit-note code
  value at all. Two paths: extend `invoice` using the type-code as a
  discriminator (how UBL itself models it) vs. separate tables —
  don't pick a side without checking first.
- **Needs the not-yet-built Payment/Finance service, not
  trade-directory:** facility/limit utilization tracking (sanctioned
  vs. drawn, breach thresholds); charge/fee/pricing engine; receipts,
  cash application, and reconciliation (Oracle's
  Exact/Generic-FIFO/LIFO/HAFO/LAFO allocation rules are a useful
  field-list reference for that service's eventual design, not
  actionable now); Purchase Order as a parallel financeable instrument
  to Invoice (bigger addition — new table + child schema, not a quick
  win).
- **Worth a selective look, not wholesale adoption:** Oracle enforces
  maker-checker (four-eyes approval) on every reference-data screen —
  likely too heavy everywhere in SQF, but worth considering for
  relationship/contract changes specifically once the RBAC/audit-log
  work lands.
- **Explicitly out of scope, don't revisit:** GL/accounting-entry
  mapping, Oracle's ML/NLP model-training UI (already solved
  differently via Markitdown + Claude vision, see "Document
  Conversion" below), commodity master, Virtual Account Management,
  EOD/BOD batch job codes.

---

## Coding Conventions

### NestJS modules
- Each feature has its own `Module`, `Service`, `Controller`, `Repository`
- Repositories extend `AbstractRepository<T>` from `libs/common` (requires `id: number` PK — **not** for outbox/processed-event repos, use standalone `@Injectable()` with `@InjectRepository()`)
- `DatabaseModule.forFeature([...entities])` in each feature module's imports
- Shared enums live in `libs/common/src/apps/trade-directory/enums/`

### Frontend
- React + Mantine UI components throughout
- `apps/web/src/constants/routes.tsx` — all route constants
- `apps/web/src/constants/enum.ts` — frontend-side enums (must stay in sync with `libs/common` enums)
- `apps/web/src/hooks/` — React Query hooks
- `apps/web/src/service/` — raw API call functions
- **Redesign in progress (2026-07-07):** the gold `#c7760a` primary action colour has been replaced. Source of truth for the palette/typography is `apps/web/design-system/sqf-sys/MASTER.md` — accent/CTA `#0369A1` blue, `#0F172A` navy. **Implemented** in the Mantine theme (`App.tsx`'s `createTheme`: `primaryColor: 'primary'`, `colors.primary`/`colors.navy` tuples generated from those two hexes, `fontFamily: 'Inter'`, `headings.fontFamily: 'Calistoga'`, fonts loaded via Google Fonts `<link>` in `index.html`). All 7 places that previously hardcoded `#c7760a` inline now use `color="primary"`.
- **Known debt — legacy hardcoded colors bypass the theme.** `apps/web/src/constants/color.tsx` defines a separate hardcoded palette (`GOLD: '#B0A275'`, `DARKBLUE`, `FHGREEN`, etc.) referenced ~30 times via inline `style={{ backgroundColor: color.GOLD }}` — this is why the Login screen and others still look gold-ish after the theme change; it was never `#c7760a` in the first place. Raw hex inline styles appear ~120 times across ~25 files app-wide, all bypassing the Mantine theme. Migrating this is a distinct, larger task — deliberately deferred (Tony's call, 2026-07-07), not an oversight. Do not assume the app is visually consistent with `MASTER.md` outside the 7 spots and the theme defaults until this migration happens.
- **No per-domain design-system page overrides.** The `ui-ux-pro-max` plugin's auto-generated per-page overrides (credit-risk, finance, compliance, etc.) were reviewed on 2026-07-07 and discarded — they resolved to generic e-commerce/marketing templates (checkout flows, product-review pages, lead-gen forms) unrelated to SQF's internal authenticated screens, with some files duplicated verbatim across unrelated domains. For actual page structure per domain, use the Domain structure and work-queue design already specified by hand below (Planned: Dynamic RBAC, Multi-Tenancy and Role-Based Dashboard section) — not any auto-generated page file.

### TypeORM
- Column names: TypeORM default is camelCase → DB column. If the DB column is snake_case (e.g. `system_role`), add `{ name: 'system_role' }` to `@Column()` explicitly.
- Relations in `findOne`/`find` use string array form: `relations: ['organizationPersons', 'organizationPersons.organization']`
- Do **not** bump `typeorm` past `^0.3.x` — v1.x has breaking changes at ~30 call sites

### Package management
- All deps in root `package.json` (Nx monorepo — no per-app package.json)
- Use `--legacy-peer-deps` for `npm ci` (Hashgraph SDK peer conflicts)
- Do **not** bump `@nestjs/common|core|microservices|platform-express` past `^10.x` — `@nestjs/axios@3` only supports Nest ≤10

---

## Testing Policy

All tests must be **end-to-end against real infrastructure** (real DB, real Kafka). No mocks unless explicitly requested. The reason: a previous incident where mocked tests passed but a prod migration failed.

---

## Security Notes (Financial Application)

All changes should be reviewed against:
- No raw SQL — use TypeORM query builder or parameterised queries
- No `console.log` in backend — use injected `Logger` (Pino)
- No hardcoded secrets — use `ConfigService` / env vars
- Rate limiting is applied to auth endpoints via `ThrottlerModule`
- Helmet.js is applied to all 5 services
- Cookies use `sameSite: strict`, `secure: true` in production

Open items not yet resolved:
- No HTTPS/TLS configured (required before production)
- ~~1 critical + 7 high npm vulns in `@hashgraph/sdk` transitive deps~~ — resolved 2026-07-20: `@hashgraph/sdk` removed entirely with the Hedera module in the document-management rebuild

---

## Security Model — Authentication

### Token lifecycle

1. **Login** (`POST /trade-directory/auth/passkey/login-verify`, or `POST /trade-directory/auth/qr/complete` for the QR relay — password login removed 2026-07-22)
   - Server verifies a WebAuthn assertion (SimpleWebAuthn, `userVerification: 'required'`, signature counter checked and persisted for clone detection).
   - On success: issues a short-lived **access token** (15 min JWT) and a long-lived **refresh token** (7-day JWT) via `AuthService.issueSession`.
   - Access token returned in the JSON response body.
   - Refresh token set as an **httpOnly, Secure, SameSite=Strict cookie** (`refresh_token`, path `/trade-directory/auth`). It never appears in the response body and is invisible to JavaScript — XSS cannot steal it.
   - A bcrypt hash of the refresh token is stored in the `token` table alongside session metadata (`issuedAt`, `expiresAt`, `userAgent`, `ipAddress`, `tokenFamilyId`).
   - `failedLoginAttempts`/`lockedUntil` are dormant (password brute-force lockout no longer applies; passkeys aren't guessable — QR pin abuse is handled by session-kill instead).

2. **Frontend token storage**
   - Access token is held in a **module-level in-memory variable** (`inMemoryAccessToken` in `axiosClient.ts`). It is never written to localStorage, sessionStorage, or any JS-readable cookie. It is lost on page refresh — by design.
   - On page load, if Redux has a persisted user identity, `SilentRefresh` (in `App.tsx`) calls `/auth/refresh` to restore the in-memory access token from the httpOnly cookie.

3. **Token rotation** (`POST /trade-directory/auth/refresh`)
   - Server reads the refresh token from the httpOnly cookie (not the request body).
   - Bcrypt-compares against all active token rows for this user.
   - If a match is found: the old row is revoked (`revokedReason = ROTATED`) and a new token row is created, sharing the same `tokenFamilyId`. A new httpOnly cookie is set with the new refresh token. The JSON response contains only the new access token.

4. **Logout** (`POST /trade-directory/auth/logout`)
   - Server reads the refresh token from the httpOnly cookie, revokes the matching row (`revokedReason = LOGOUT`), and clears the cookie (`Expires = epoch`). No token value is needed in the request body.
   - Frontend calls `setAccessToken(null)` to clear the in-memory access token.

### Automatic session revocation scenarios

| Trigger | What happens |
|---|---|
| Rotated token replayed (theft detected) | All active tokens in the same `tokenFamilyId` family are revoked (`ROTATION_ABUSE`). A security alert email is sent to the account holder via the Kafka outbox. 401 returned. |
| Refresh token expired (`expiresAt < now`) | Token row revoked (`FORCE_REVOKE`). 401 returned. |
| QR authorization pin mismatch | Entire QR session killed instantly (desktop WS gets `SESSION_INVALID`); logged as `QR_LOGIN_REJECTED`. (Password lockout rows retired with password login, 2026-07-22.) |
| Stale passkey signature counter (cloned authenticator) | Assertion rejected, logged as `PASSKEY_LOGIN_FAILURE`. |

### Audit trail

Every auth event writes an append-only row to `auth_audit_log` (no UPDATE or DELETE on this table):
- Events: `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGIN_LOCKED`, `LOGIN_BLOCKED`, `REFRESH_SUCCESS`, `REFRESH_FAILURE`, `REFRESH_THEFT`, `LOGOUT`, `PASSWORD_RESET`
- Columns: `event`, `email`, `personId`, `outcome`, `detail`, `ipAddress`, `userAgent`, `createdAt`

### Key files

| File | Role |
|---|---|
| `apps/trade-directory/src/auth/auth.service.ts` | All auth logic: login, refresh, logout, lockout, rotation abuse |
| `apps/trade-directory/src/models/token.entity.ts` | Token table: hash, family, session metadata |
| `apps/trade-directory/src/models/auth-audit-log.entity.ts` | Audit log entity (append-only) |
| `apps/trade-directory/src/repositories/auth-audit-log.repository.ts` | Write-only audit repository |
| `apps/trade-directory/src/main.ts` | cookie-parser registered here |
| `apps/web/src/api/axiosClient.ts` | In-memory access token, `setAccessToken`/`getAccessToken`, refresh interceptor |
| `apps/web/src/App.tsx` | `SilentRefresh` component restores access token on page load |
| `apps/notification/templates/account-locked.pug` | Lockout alert email template |
| `apps/notification/templates/security-alert.pug` | Token theft alert email template |

---

## Production Deployment Roadmap (Not Yet Started)

SQF currently only runs in local dev (`docker compose` + Vite). Once local-dev build-out is complete, the next phase is standing up **production infrastructure on AWS** and **CI/CD**, with Claude Code acting as build-time Engineering Orchestrator (per [AGENT.md](AGENT.md)) helping Tony design and build it — not just code review it.

**IaC tool: Terraform.** All AWS infrastructure is defined as Terraform, not manual console/CLI changes — `plan` reviewed before every `apply`, consistent with the human-sign-off gate in [AGENT.md](AGENT.md).

Expect this phase to cover (none of it exists yet):
- AWS account/infra design for the 5 NestJS microservices + React/Vite frontend + Postgres (one DB per service) + Kafka — likely ECS/Fargate or EKS, RDS per service, MSK or a managed Kafka equivalent, S3 (already used for document storage), ALB/CloudFront for the frontend. All provisioned via Terraform.
- CI/CD pipeline (GitHub Actions or equivalent) — build, test, deploy per service (including `terraform plan`/`apply` steps), since there's currently no `.github/workflows` and no automated pipeline at all.
- Closing the open security items above before going live: real TLS/HTTPS, `httpOnly` cookies, secrets management (AWS Secrets Manager / Parameter Store instead of `.env` files). (The `@hashgraph/sdk` vulns were resolved by removing the dependency in the 2026-07-20 document-management rebuild.)
- This also satisfies the Release Agent and Migration Agent roles described in [AGENT.md](AGENT.md) (`agents/deploy/`), which are currently specs only, not implemented — building real CI/CD is what gives those agents something to actually run.
- **Per-Funder isolated provisioning, not a single shared prod stack (confirmed 2026-07-17).** Each Funder subscription gets its own bounded cloud environment/account with no shared network or DB — see "Planned: SQFSYS Admin Portal" below. This Terraform work needs to produce a repeatable per-Funder "stamp" (all services + DBs + Kafka provisioned fresh per Funder), not one shared production environment sized for many tenants. Cloud-account ownership model (Synlian-provisioned isolated account vs. Funder-supplied BYOC) is still open — settle before starting Terraform design.

**Sequencing:** do not start this until Tony explicitly says local dev is feature-complete — this is a roadmap note, not a current task.

---

## Multi-Tenancy & Data Governance (Future SaaS Phase)

SQF is moving toward multi-tenant SaaS — multiple unrelated client organizations (Funders) each licensing the platform, served partly by [domain product agents](AGENT.md) (Risk, Sales & Customer Management, Finance & Accounting). These principles govern that phase and apply to every product agent's design from the start, not as a later retrofit. **Payment is a microservice, not an agent** (corrected 2026-07-18) — it's called by the Finance & Accounting Agent (still to be defined), the same way any other deterministic backend service is called by the agent that needs it; it does not have its own agent.

**Deployment isolation model (confirmed 2026-07-17).** "Multi-tenant" here means multi-*customer*, not shared-infrastructure multi-tenancy: each Funder's subscription runs in its own bounded cloud environment and cloud provider account, with **no shared network, database, or data connection between Funders.** See "Planned: SQFSYS Admin Portal" below for the platform-operator layer that sits above these isolated deployments (Funder initialization, billing, security/IT-ops, cross-deployment data lake). This sharpens principle 1 below — isolation is enforced at the infrastructure level, not just application-level tenant scoping — and means the existing `funderPersonaId` row-level scoping used throughout trade-directory (Trade Directory Redesign, Dynamic RBAC below) is defense-in-depth *within* a single Funder's own deployment, not the production tenant boundary itself. That's a real gap between the row-scoping design as written and this deployment model — worth reconciling explicitly when the RBAC/dashboard work is actually built, not assumed either way.

1. **Tenant data isolation, with a Tony-level exception.** A product agent may never share another tenant's data or "experience" (learned patterns, extracted context, prior decisions) with a customer it is not contracted with. Cross-tenant leakage is a hard boundary, not a tunable setting. The one exception: agents may share **consolidated** (aggregated/anonymized, not raw per-tenant) experience and data with Tony, e.g. for platform-wide tuning, eval, and oversight. "Consolidated" means tenant-attributable detail has been stripped or aggregated away before it reaches that channel — a per-tenant record is never an acceptable substitute for a consolidated one.
2. **Daily reporting cadence for product agents.** Each product agent must produce a consolidated daily report to its human supervisor, delivered in both written and verbal form — modeled on a 15-minute daily scrum. This is an operational requirement on every domain agent's harness (see the Observability Agent and the agentic SDLC's "observe & iterate" phase in [AGENT.md](AGENT.md)), not optional telemetry.
3. **Extensible, tenant-agnostic data architecture.** Because SQF will run financial services SaaS for multiple clients, the data architecture must be designed so onboarding/migrating a new customer's data onto the platform is low-complexity and fast — not a bespoke schema or pipeline per tenant. Favor shared, parameterized schemas and migration tooling over one-off per-tenant customization from the outset.

**Status:** governance principles only — no multi-tenancy implementation exists yet (current per-service Postgres databases are single-tenant, single shared dev deployment). The deployment *model* (isolated per-Funder cloud environments) is now decided per above; the *implementation* — Terraform per-Funder provisioning, the SQFSYS Admin Portal, reconciling `funderPersonaId` row-scoping against deployment-level isolation — is not. Apply these as design constraints once multi-tenant work starts; do not treat their absence from the current schema as a gap to fix today unless Tony asks.

---

## Planned: SQFSYS Admin Portal (Platform Operator)

Decided 2026-07-17 (Tony). A new, separate portal — the **SQFSYS Admin
Portal** — is the platform-operator (Synlian) control plane across
every isolated Funder deployment described above. It is distinct from
the per-Funder **Super Admin portal** (the Dynamic RBAC /
role-based-dashboard work described below, which is tenant-scoped and
lives inside each Funder's own deployment, built by that Funder's own
appointed Super Admin). The SQFSYS Admin Portal:

1. **Initializes Funders** — creates the Funder Org + first Super
   Admin (same bootstrap scope as today's dev-only `/system-setup`
   flow, see "SQFSYS System Role" above), but in production this is
   the trigger that provisions a new isolated Funder deployment, not a
   row in a shared dev DB.
2. **Pulls data from Funder deployments into a central data lake or
   knowledge graph** owned by SQFSYS/Synlian — separate from each
   Funder's own `knowledge-graph` service instance, which stays scoped
   to that Funder's own trade network.
3. **Drives a single dashboard** for billing Funders and for managing
   security and IT operations across the whole fleet of Funder
   deployments.

**Status:** scope decision only, 2026-07-17. Not built — no
architecture decided yet for which service/app owns this portal, what
"data lake or knowledge graph" tech choice it uses, or how the data
pull works across environments that are required to have no shared
network/DB connection to each other (the pull target is presumably
the SQFSYS control plane on one side only, never a Funder-to-Funder
link — needs an explicit design before building).

**Open item — cloud account ownership model not yet specified.**
"Their own... cloud provider account" could mean Synlian provisions an
isolated account per Funder within Synlian's own cloud organization
(e.g. AWS Organizations, one account per Funder) or that each Funder
supplies their own external cloud account (BYOC). This materially
changes the Terraform/CI-CD design in "Production Deployment Roadmap"
below and should be settled before that work starts.

**Open item — data-pull scope vs. the tenant-isolation principle
above.** Principle 1 above says agents may share only *consolidated*
(aggregated/anonymized) data with Tony, never raw per-tenant records.
The SQFSYS Admin Portal's data-lake pull is platform-operator
telemetry (billing, security, IT ops) — a different category from a
product agent sharing tenant experience, closer to ordinary SaaS
vendor operational telemetry — but whether it pulls raw per-Funder
data or only aggregates hasn't been specified. Confirm with Tony
before building the pull mechanism.

---

## Marketing Agent (Synlian Organization, New)

A new [Marketing Agent](agents/growth/marketing-agent/AGENT.md) has been added to the Synlian Data@Source org under a new cross-cutting **Growth** group in [AGENT.md](AGENT.md) — sibling to Build/Deploy/Operate/Governance/Target Domain Agents, but not gated by or gating the SQF product SDLC.

- **Scope:** the marketing website (distinct from the product's own `apps/web`), promotional video scripting, social media marketing campaigns, and market research for SQF's go-to-market.
- **Status:** design phase, no production autonomy.
- **Key constraint:** because its output is public-facing (publishing, posting, ad spend), it inherits the "Explicit permission required" treatment from Claude Code's own safety rules — no autonomous publish/post/spend until Tony explicitly raises its autonomy tier, and any regulated financial-promotion claim requires Policy Agent + Tony sign-off first.

---

## Document Management redesign (BUILT 2026-07-20; design agreed 2026-07-19)

The document-management microservice was **completely rebuilt** across
seven phases (commits 0dbd024 → Phase 7), replacing the legacy pipeline
entirely. Design source: `SQF ARCHITECTURE/Document Management
Design.docx` (+ `SOFTWARE MANUALS/NewHorizons_DefaultRiskProfile_1.docx`
for the extraction target). Every phase was E2E-verified against real
Postgres/Kafka/MinIO/Claude before its commit.

**As built:**
- **Code**: `apps/document-management/src/modules/documents/` (service,
  controllers, extraction processor, Claude extraction,
  cross-validation, invoice math gate, outbox relay) + `markitdown` and
  `vision-extraction` as the only supporting modules. Tables:
  `document`, `document_event` (append-only audit), `outbox_event`,
  `processed_event` (migrations 001–005).
- **Upload** (`POST /documents/upload`, JWT): per-class rules —
  onboarding classes accept PDF/CSV/Excel only and reject image-only
  files (no-text-layer PDFs rejected via Markitdown check); SHA-256
  computed in-service; S3 put before the DB transaction; UPLOADED
  audit event. Presigned 15-min URLs (`GET /documents/:uuid/url`),
  each issuance audited.
- **Extraction**: 30s cron claims UPLOADED docs
  (optimistic UPLOADED→EXTRACTING), Markitdown conversion (CSV passes
  through raw — markitdown's CSV table inference drops columns on
  comma-less title rows), Claude field extraction per class
  (`extraction-targets.ts`; financial statements target
  `financial_credit_report` fields incl. latest + prior year), vision
  fallback for invoices only.
- **Kafka (outbox everywhere)**: publishes DOCUMENT_EXTRACTED
  (risk-operation ingests financials incl. deterministically computed
  ratio columns; trade-directory answers COMPANY_REGISTRY with a
  DOCUMENT_VALIDATION_DATA snapshot) and INVOICE_EXTRACTION_VALIDATED
  (trade-directory's InvoiceIntakeModule → existing lines-only
  `InvoiceService.create`, issuer/debtor via the auto-create/dedup
  flow).
- **Cross-validation**: deterministic-first (normalized exact match in
  code), Claude judges only fuzzy pairs; per-field
  method/verdict/reasoning stored in `validationResult`. Discrepancies
  → `GET /documents/discrepancies` + audited
  `POST /:uuid/clear-discrepancies` (Risk Officer intent).
- **Invoice math gate**: line qty×price = line total and Σlines + tax +
  charges = stated payable (cent tolerance, fails closed). Pass →
  invoice created in trade-directory with payable equal to the stated
  total exactly (absolute tax spread as uniform per-line percent;
  charges as tax-free lines). Fail → `GET /documents/invoice-mismatches`
  queue + audited `POST /:uuid/reconcile` (corrected numbers must
  themselves pass the gate). **No human review on the happy path.**
- **Search**: `GET /documents/search` — metadata only (org, class,
  status, date range, filename, refId), current + archived;
  `POST /:uuid/archive` (metadata state, never deletes the S3 object).
- **Local dev**: MinIO in docker-compose is the S3-compatible store
  (`S3_ENDPOINT` env override; dev AWS creds were placeholders — real
  S3 + Object Lock is a production/Terraform concern). Kafka has a
  restart policy + 512M heap cap after repeated dev OOM exits.
- **Teardown (Phase 6)**: DeepSeek + prompt templates, API-key auth,
  webhook delivery, Hedera consensus messaging, their cron jobs,
  entities, and tables all removed; `@hashgraph/sdk` dropped from
  package.json (clearing the 1 critical + 7 high npm vulns). Legacy
  `apps/web` Document Management screens now 404 — expected; screens
  are rebuilt from the storyboard in `apps/web-next`.
- **Held for later**: screens (storyboard pending), role enforcement
  (Risk Officer / Finance Analyst intents documented at each endpoint,
  enforced when Dynamic RBAC lands), production S3 Object
  Lock/SSE-KMS/virus scan (Terraform phase).

**Default risk profile scoring alignment (2026-07-20).** Two follow-on
fixes after the rebuild, both E2E-verified via
`apps/risk-operation/src/scripts/verify-default-profile-scoring.ts` —
the standing regression guard for the whole scoring chain: it runs the
DefaultRiskProfile manual's ABC Manufacturing worked example through
the full pipeline, asserts all 10 sub-parameter verdicts, then computes
the weighted total from the DEFAULT profile's stored weights (87.5
under the seeded 30/25/15/15/15) and asserts it classifies LOW risk
against the stored band ranges. Rerun it after any change to
extraction targets, intake, the scoring lookup, weights, or bands:
- The Filter 1 scoring engine previously could not resolve 9 of the 10
  seeded default-profile sub-parameters (its lookup only knew legacy
  Moody's-style names). `FinancialCreditReportService.findOne` now
  returns a `defaultProfileMeasures` section computed per the manual's
  formulas — point-in-time ratios from the latest fiscal year,
  Revenue Growth Rate / Profit Margin Trend across latest + prior
  year — and the lookup maps all 10 seeded names to it (legacy names
  kept). `financial_credit_report` gained an `inventory` column
  (Quick Ratio) and extraction now captures total assets
  (`total_equity_and_liabilities`). The legacy ratio averaging in
  `findOne` is null-tolerant (intake-written rows lack legacy
  columns).
- **Risk band semantics (Tony's ruling): a HIGH total score means LOW
  risk** — bands are score ranges named by the risk they imply: Low
  risk = 71–100, Medium = 31–70, High risk = 0–30. Seed + all
  existing profiles corrected (the original orientation was inverted
  vs. the manual's worked example). The classifier itself is
  range-containment and needed no change. Don't reintroduce the
  inverted orientation in new profiles, seeds, or screens.

**Original scope, as designed:**
1. **Onboarding document intake** — six document types (company
   registry, KYC credit report, bank statements, proof of address,
   director ID, P&L/balance sheet), required set determined by the
   product applied for. CSV/Excel/PDF only; **image-only files are
   rejected at onboarding** (no vision fallback there — enforce via the
   existing `MIN_VIABLE_TEXT_LENGTH`-style check, returning an upload
   error). Claude extracts data to populate the default risk profile
   (`is_default = 1` in risk-operation — 5 parameters / 10
   sub-parameters scoring `financial_credit_report` fields; needs
   latest + prior year financials for the trend sub-parameters).
2. **Storage** — S3 + Object Lock (Compliance Mode) + versioning for
   infrastructure-level immutability (production/Terraform concern);
   SHA-256 + metadata (document ID/company ID/type/hash/timestamp)
   computed **in-service at upload time** (works identically in dev and
   prod; a Lambda is only a production-side integrity backstop).
   Metadata lives in **Postgres** (service's own DB), not DynamoDB.
   SSE-KMS at rest, virus scan before hashing, presigned short-lived
   URLs, bucket never public.
3. **Cross-validation** — extracted data checked against DB
   (registration numbers, director names, addresses).
   **Deterministic-first**: exact-matchable fields compared in code;
   Claude only judges fuzzy cases (name variants, address formats).
   Discrepancies → flagged on the Applicant list (Risk Dashboard);
   Risk Officer clears → risk profile created → go/no-go.
4. **Invoices** — same storage; Markitdown → Claude vision fallback
   allowed; extraction produces UBL lines + stated total; arithmetic
   check (line qty×price; Σlines + tax + freight/insurance = stated
   total). Clean invoices feed the existing lines-only invoice API.
   Mismatches → Finance Analyst (AR specialist) queue for manual
   reconciliation, with audit.
5. **Document search engine** — metadata search (company/type/date)
   over current + archived files. Not full-text content search.

**Decisions confirmed by Tony (2026-07-19):**
- Replace everything: DeepSeek extraction + prompt templates, API-key
  auth, webhook delivery, and the **Hedera consensus-messaging module
  are all removed** (S3 Object Lock covers tamper-evidence).
- Claude replaces DeepSeek as the extraction LLM.
- All cross-service data flow via **Kafka** (outbox pattern) — e.g.
  extracted org data → trade-directory, financials →
  risk-operation — never direct cross-DB writes.
- **No human review on the happy path** — the arithmetic check
  replaces the 2026-06-25 `PENDING_REVIEW` human gate for
  vision-transcribed invoices; numeric validation is the gate.
- Finance Analyst (AR specialist) role: **assume it exists** — Tony is
  producing the new RBAC design separately; don't add it to
  `OrganizationPersonRoleEnum`/CASL (per the standing RBAC rule).
- A generic append-only **`document_event` audit table** (who/what/
  when/before-after status) covers reconciliation and future audit
  needs — one table, not per-feature audits.

## Document Conversion (Markitdown)

[Microsoft Markitdown](https://github.com/microsoft/markitdown) converts Word/Excel/PowerPoint documents to Markdown before LLM extraction. Markdown is far cheaper in tokens than raw OOXML-derived text and preserves structure (tables, headings) better than naive extraction.

**Status: used by the rebuilt `documents` module** ([markitdown.service.ts](apps/document-management/src/modules/markitdown/markitdown.service.ts)) for PDF/DOCX/XLSX conversion. **CSV is deliberately NOT converted** — Markitdown's CSV table inference infers column count from the first row, so a comma-less title row silently drops every other column (found via E2E, 2026-07-19); CSVs are passed to Claude as raw text.

**Vision-LLM fallback for documents with no text layer:** Markitdown does **not** do OCR — its PDF converter (`pdfminer.six`) only extracts embedded text layers, and its image converter reads only EXIF. When Markitdown output is under `MIN_VIABLE_TEXT_LENGTH` (20 non-whitespace chars): **onboarding document classes reject the upload outright** (scanned files not supported for onboarding, per design), while **invoices** fall back to [vision-extraction.service.ts](apps/document-management/src/modules/vision-extraction/vision-extraction.service.ts) — Claude transcribes the page images to Markdown (`pdfs-2024-09-25` beta for PDFs, standard `image` blocks otherwise). Vision transcription is generative, not deterministic OCR; per the 2026-07-19 decision it is gated by the deterministic invoice arithmetic check rather than blanket human review — a misread number that breaks the math lands the invoice in the Finance Analyst reconciliation queue.

Requires `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` env vars (same convention as `apps/risk-agent`).

**Why Markitdown needs Python, and why the base image changed:** Markitdown is a Python package (no Node runtime). Its `magika` dependency requires `onnxruntime`, which has **no Alpine/musl wheel** — `document-management`'s [Dockerfile](apps/document-management/Dockerfile) base image was changed from `node:18-alpine` to `node:18-bookworm-slim` (glibc) for this reason. Every other SQF service stays on `node:18-alpine` unless it also needs Markitdown.

**Install pattern (apply to any new service needing Markitdown):**
- Local/Docker: `apt-get install python3 python3-venv`, then `python3 -m venv /opt/markitdown-venv && /opt/markitdown-venv/bin/pip install 'markitdown[docx,xlsx,pptx,pdf]'`. Use the `[docx,xlsx,pptx,pdf]` extras, not `[all]` — `[all]` pulls extra OCR/audio dependencies that aren't needed and don't change the Alpine-incompatibility either way.
- Install at a fixed path outside `WORKDIR` (e.g. `/opt/markitdown-venv`) so the same `MARKITDOWN_BIN_PATH`-style env var works across every Dockerfile stage/target, regardless of each stage's own `WORKDIR`/copy layout.
- **Never install into global/system Python** on a dev machine — it silently upgrades shared packages (pillow, protobuf) and can break unrelated Python projects (this happened once with a global install clashing with `streamlit`). Always use an isolated venv.
- Invoke via `child_process.execFile` (not `exec` — avoids shell injection) from the Node service, passing the file path as an argv element, never interpolated into a shell string.
- Apply this pattern to any SQF service or future Synlian Data@Source project that converts Word/Excel/PDF/PowerPoint for LLM processing.

## Proto / gRPC Layer

`libs/common/src/apps/trade-directory/proto/entity.ts` contains proto-generated enums. When adding a new value to `libs/common/src/apps/trade-directory/enums/organization-person-role.enum.ts`, also add it to:
1. `proto/entity.ts` — `OrganizationPersonRoleEnum`
2. `proto-converter.ts` — both `convertToApp` and `convertToProto` maps
3. `apps/web/src/constants/enum.ts` — frontend enum

## Planned: Frontend Rebuild — Full Rewrite, Mantine Removed (scoped 2026-07-15)

Tony has decided SQF's frontend will be completely rebuilt, not
incrementally migrated — **Mantine is being removed entirely.** The
replacement UI layer is the `ui-ux-pro-max` plugin's ui-styling stack
(shadcn/ui: Radix UI primitives + Tailwind CSS), which Tony has
installed locally. This supersedes the original, more open-ended
"state machine needs to change" flag from earlier the same day —
state management (currently Redux for persisted identity + React
Query for server state + ad-hoc local component state, no unified
state-machine library) is also in scope for reconsideration as part of
this rebuild, but not yet decided.

**Status: chassis scaffolded (2026-07-15), screens not started.** Tony
is providing the storyboard, navigation, and business logic as the
design input before real screens get built — the chassis below is
infrastructure only (auth, routing skeleton, base components), not a
green light to build domain screens without that spec in hand.

### Agreed screen-build pipeline (2026-07-22) — four phases per domain

This is HOW the storyboard input above turns into built screens; it makes
the Dynamic RBAC permission model part of the design input so authorization
is never retrofitted:

1. **Sitemap inventory** — Tony completes the domain's sitemap + supporting
   notes (business logic, process definitions, work-queue rules).
2. **Joint permission-key annotation** — Tony + Claude annotate it together
   using the standard notation (`[gate:]`/`[action:]`/`[inherit:]` + queue
   rules; notation and CRUD-plus verb rules in the Dynamic RBAC section).
   Claude proposes the annotated version + new dictionary keys for Tony's
   sign-off; reused keys are marked so no near-duplicates get minted. A CRM
   worked example was produced 2026-07-22 (in the conversation record /
   project memory) — CRM's phase 2 is effectively drafted.
3. **Skeleton wireframes** from the annotated inventory.
4. **Final build in web-next** — screens + dictionary migration +
   `@RequirePermission` guards + manifest nav extension land together.

Sequencing: **domain-by-domain, not big-bang** — one domain can be at
phase 4 while others are at phase 1. The **Funder Administration Portal can
jump straight to phase 3** whenever Tony chooses: its interaction spec
(Dynamic RBAC section), APIs, and `admin_*` keys already exist — it only
needs the visual design pass.

### Dashboard visualization standard (agreed 2026-07-21)

Tony's upcoming design includes many dashboards (line graphs, donut/pie
charts, traffic-light indicators, interactive date ranges). Agreed
tooling for all `apps/web-next` dashboards:

- **Recharts via shadcn/ui's chart components** (`ChartContainer`,
  `ChartTooltip`, etc.) is the single charting standard. Rationale:
  native companion to the committed shadcn/Radix/Tailwind stack —
  charts theme through CSS variables, so ui-ux-pro-max design tokens
  apply automatically; `recharts` is already a dependency; the legacy
  app's `@mantine/charts` wraps Recharts too, so it's one mental model
  across both apps. Line = `LineChart`/`AreaChart`; donut/pie =
  `PieChart` (+ `innerRadius`); interactivity = tooltips, legend
  series-toggling, click events (e.g. donut slice → drill-down), and
  `Brush` for in-chart range zoom.
- **Date-range interaction is a data-layer concern, not a chart
  feature**: a shadcn date-range picker outside the chart drives the
  React Query fetch so the backend aggregates for the selected window;
  `Brush` only supplements within the fetched window. Build every
  dashboard this way.
- **Traffic lights are NOT charts** — build one shared shadcn
  badge/tile component using semantic design-system color tokens, with
  a text label (never color alone, accessibility). Used for e.g. the
  risk-band result (LOW/MEDIUM/HIGH) in tables, cards, and headers.
- **One chart library only.** Recharts is SVG — fine at dashboard
  scale; for genuinely huge series (only foreseeable candidate: the
  SQFSYS system-traffic dashboard) the first answer is server-side
  aggregation, and ECharts would be a per-screen escape hatch only if
  that ever proves insufficient — do not adopt it preemptively.
- Housekeeping at legacy cutover: drop `chart.js` +
  `react-chartjs-2` from package.json; `web-next` uses Recharts only.

### `apps/web-next` chassis (built 2026-07-15)

A working, empty-of-domain-content app proving the stack end-to-end:
- **Stack**: Vite + React + TS on port 3002 (`apps/web-next/`, `project.json` mirrors `apps/web`'s `nx:run-commands` pattern). `npm run serve:web-next`, or `.claude/launch.json`'s `"web-next"` config.
- **UI layer**: Tailwind + shadcn/ui, `components.json` present so `npx shadcn@latest add <component>` works normally. Base components so far: `Button`, `Input`, `Label`, `Card` (`src/components/ui/`). Design tokens are placeholder neutral/slate HSL values in `src/index.css` — **not** the real visual identity, which lands via `ui-ux-pro-max` token generation separately.
- **Data layer unchanged, per the earlier decision**: `axiosClient.ts` (in-memory access token + refresh-cookie rotation), Redux (`redux-persist`, `user` slice), and `@tanstack/react-query` v5 are ported/reused as-is from `apps/web` — same backend, same auth model. One deliberate simplification: `apps/web`'s split between `axiosClient` and a separate `apiClient`/`publicClient` (`utils/reactQuery.ts`) is *not* carried over — `web-next` uses a single `axiosClient` everywhere, since that split was scar tissue from an incremental migration that doesn't apply to a from-scratch rebuild.
- **Auth flow proven live**: `screens/Auth/Login.tsx` (2-step email → password+org, same as `apps/web`) and a protected `screens/Home/Home.tsx` behind `PrivateRoute`, verified end-to-end against the real trade-directory service (login → `/api/person/me` → protected route), side by side with `apps/web` still working unmodified on 3001.
- **Routes are deliberately minimal** (`constants/routes.ts` — just `AUTH.LOGIN` and `HOME`). Real routes get added as the storyboard defines each screen — don't pre-build a route map speculatively.

### Backend changes required to support a second frontend origin (2026-07-15)

Standing up `web-next` on a different port than `apps/web` exposed that CORS was hardcoded to a single origin in **two places**, not one:
1. Each service's `main.ts` (`app.enableCors({ origin: [configService.getOrThrow('FRONTEND_DOMAIN')] })`) — now parses `FRONTEND_DOMAIN` as a comma-separated list (`.split(',').map(o => o.trim())`) instead of wrapping the raw string in an array. Applied identically across all 7 services (trade-directory, risk-operation, customer-relationship-management, document-management, notification, knowledge-graph, risk-agent). Each `apps/*/.env` (gitignored, local-only) is now `FRONTEND_DOMAIN=http://localhost:3001,http://localhost:3002`.
2. **The nginx gateway (`nginx/default.conf`) was the actual enforcing layer**, not the NestJS-level config above — it hardcoded `set $cors_origin "http://localhost:3001"` and used `proxy_hide_header` to strip whatever CORS headers each backend service set, replacing them with its own static ones. Fixed with an nginx `map $http_origin $cors_origin { default ""; "~^http://localhost:(3001|3002)$" $http_origin; }` — reflects the request Origin only if it's an allowed local dev frontend, empty (blocked) otherwise. No wildcard, per the existing CORS security requirement. **If a third frontend origin is ever needed, update the regex in this map, not just the `.env` files** — the `.env` change alone silently does nothing while this nginx config is in front of it.

Container-ops notes surfaced while fixing this (useful beyond this specific change):
- **`docker compose restart <service>` does not re-read `.env`/`env_file` changes** — only `docker compose up -d` (or `--force-recreate`) does, since `restart` reuses the existing container's already-resolved environment. If a service isn't picking up an `.env` edit, recreate it, don't just restart it.
- **nginx caches upstream container IPs at its own startup** and does not re-resolve on a backend container's IP change (e.g. after that backend was recreated) — if a service is healthy but the gateway still 502s it with "connect() failed... while connecting to upstream," restart `backend-gateway` too.
- **The `kafka` container can silently exit (OOM or otherwise) independently of the app services** — every dependent service will crash-loop with `KafkaJSConnectionError: getaddrinfo ENOTFOUND kafka`, which looks identical to the already-documented "fresh boot" flake below but has a different fix: `docker compose ps kafka` to check it's actually `Up`, `docker compose up -d kafka` if not, *then* restart the dependent services — restarting them alone won't help if kafka itself is down.
- Fixed a genuine pre-existing bug found via this process: `libs/common/src/apps/trade-directory/proto-converter.ts`'s `OrganizationProtoConverter`/`PersonProtoConverter.convertToApp` were missing the `organizationDocuments`/`supportingDocuments` fields added to the `Organization`/`Person` entities during the 2026-07-14 document-tables work, which broke `customer-relationship-management-service`'s webpack build (`TS2741`) the moment it was rebuilt fresh. Both now explicitly set to `undefined`, matching the existing pattern for other app-only, non-proto-carried relations (e.g. `kycAgencyReports`).

**Build strategy: parallel app, not in-place.** The new frontend is
built in a new app directory (working name `apps/web-next`) alongside
the existing `apps/web`, which keeps running untouched for local dev
and as a working reference during the build. Cutover (routing/deploy
swap) happens only once the new app is ready. Chosen over deleting and
rebuilding `apps/web` in place, which would leave no working reference
app during what's likely a multi-week effort.

**`ui-ux-pro-max`'s role expands with this decision.** The existing
2026-07-07 decision ("No per-domain design-system page overrides"
under Coding Conventions → Frontend) scoped the plugin to
design-system tokens only for the *Mantine* app, because its
auto-generated per-page overrides were generic e-commerce/marketing
templates and were discarded. In the new app its ui-styling skill
becomes the actual component library and layout tooling, not just a
token source — Tailwind utility classes are already used in a few
places in the current app (e.g. `Login.tsx`), so this is a change of
degree, not 100% new tooling. Actual page/screen structure still comes
from Tony's own storyboard/navigation spec, not auto-generated by the
plugin — that constraint carries forward unchanged.

**How to apply in the meantime:** the current `apps/web` is now
effectively legacy/frozen-in-spirit — don't invest in deepening its
Mantine/Redux pattern (no new Redux slices, no new bespoke state
wiring, no new Mantine-heavy screens) since it's being replaced
wholesale, not migrated screen-by-screen. Keep it running and
functional for reference and local dev until cutover, but treat any
further work on it as maintenance, not investment.

## Dynamic RBAC (backend BUILT 2026-07-22) and Planned Role-Based Dashboard

### Dynamic RBAC — as built

Backend + APIs shipped 2026-07-22 from Tony's "Dynanic RBAC.pdf" spec, with
scope agreed before building: **fluid runtime roles** (created/renamed/deleted
via UI at runtime — this SUPERSEDES the earlier "Option B / global role names
only" ruling), grafted onto the existing identity tables (no parallel `users`
table), backend-only for now (the three Funder Administration Portal screens —
Role Builder, User Directory, Audit Ledger — await Tony's frontend design),
enforcement phase 1 = trade-directory + manifest.

**Core rule: code checks permission KEYS, never roles.** Guard endpoints with
`@UseGuards(PermissionGuard)` + `@RequirePermission('domain_action_subaction')`
(`apps/trade-directory/src/rbac/permission.guard.ts`); the frontend reads
`GET /api/rbac/manifest` (identity + permission keys + categories) — no
hardcoded role checks anywhere.

- **Tables** (migration `1784700000000-DynamicRbac.ts`): `organization_role`
  extended in place (`organizationId` FK = tenant scope, `isImmutable`, unique
  org+name — the previously-empty table CLAUDE.md earmarked for this);
  `permission` (code-owned dictionary — never rename a key in place, add +
  migrate; naming convention below. 40 keys across 9 categories seeded by the
  RBAC migration; +19 keys / 3 new categories for the Funder Administration
  Portal in `1784800000000-FunderAdminPortalPermissions.ts` per the approved
  annotation `docs/design/funder-admin-portal-sitemap-annotation.md` — 59
  keys / 12 categories total);
  `role_permission`, `person_role` (junctions, cascade deletes);
  `rbac_audit_log` (append-only, jsonb `metadataPayload` with
  historical_state/transformed_state snapshots, written **in the same
  transaction** as the change — deliberately not async, and the "Last Admin" /
  session-kill corrections from the spec review apply).
- **Bypass rules**: SQFSYS accounts and holders of an immutable role (the
  per-org "Super Admin" role) hold every key implicitly — the immutable role
  needs no role_permission upkeep as the dictionary grows.
- **Safeguards** (all E2E-tested): immutable role cannot be renamed/deleted/
  permission-edited (attempt → 403 + `TAMPER_ATTEMPT` audit row); the last
  holder of an immutable role cannot be unassigned (400); org isolation —
  roles resolve only within the caller's JWT orgId.
- **APIs** (`/trade-directory/api/rbac/…`): `manifest` (any authenticated
  user); `permissions` (grouped dictionary); `roles` CRUD +
  `PUT roles/:id/permissions` (whole-set replace, Role Builder save);
  `users` + `POST/DELETE users/:personId/roles[…]`; `audit` (org-scoped,
  paginated); `POST users/:personId/revoke-sessions` (kill switch = revokes
  all refresh-token rows; access tokens die ≤15min). Admin endpoints require
  the `admin_*` keys.
- **Permission changes are effectively immediate**: permissions resolve live
  per request behind a 30s in-process cache that's cleared on every RBAC
  write (single-instance dev; multi-instance production would move the bust
  to a Redis broadcast — Terraform phase, same story as the passkey TTL maps).
- **Bootstrap**: SystemSetup initialize now also creates the Funder org's
  immutable Super Admin role and assigns the first Super Admin (everything
  else still starts empty per the narrow-initialization ruling).
  `apps/trade-directory/src/scripts/backfill-super-admin-roles.ts` converts
  legacy enum SUPERUSER holders (idempotent; run 2026-07-22 for the dev DB,
  plus a manual grant of org-2 Super Admin to `admin@sqf.local`, which holds
  no legacy enum role). Passkey enrollment-token issuance now also accepts
  `admin_enrollment_tokens_issue` holders.
- **E2E regression guard:** `node apps/trade-directory/src/scripts/e2e-rbac.mjs`
  (host, Node ≥22) — 46 checks: backfill path, manifest, guard deny/allow
  flips on live permission edits, role lifecycle, immutable/last-admin
  safeguards, tenant isolation across two orgs, session revocation, audit
  snapshot assertions. The manifest check reads the dictionary size live (an
  add-only permission migration doesn't break it), and last-admin enforcement
  runs in the script-owned Org B — org 2's immutable role has real holders
  (admin@sqf.local), so "last holder" is only deterministic in a
  script-created org (fixed 2026-07-24 after both assumptions broke). Shares `scripts/lib/soft-authenticator.mjs` with
  e2e-passkey.mjs (both must stay green).
- **Gotcha that cost a debugging round:** the global
  `ValidationPipe({ whitelist: true })` STRIPS any DTO property that has no
  class-validator decorator — an undecorated `roleId` arrived as `undefined`,
  and TypeORM drops undefined criteria, matching an arbitrary row. Every DTO
  property needs a decorator, and repository lookups by client-supplied ids
  should reject non-integers (see `getOwnOrgRole`).

**Not done yet (deliberate):** the three portal screens (await Tony's
frontend design; build in web-next); rolling `@RequirePermission` onto
existing feature endpoints (they keep JwtAuthGuard + funderPersonaId scoping
until their screens go manifest-driven — do the swap per-domain, not
big-bang); retiring CASL + the enum `organization_person_role` path (legacy,
untouched); cross-service enforcement (each service adopts the guard when its
domain is built); production INSERT-only DB grant for rbac_audit_log
(Terraform phase). Row-level rules ("RM sees only own applications") stay
code-side by design — flat keys gate features, funderPersonaId +
ownership filters gate rows.

### Permission-key naming convention (agreed with Tony, 2026-07-22)

Authoring permission keys is an ARCHITECTURE activity: as Tony designs each
screen/process, the keys are part of the design output and land as a
migration with the feature. Each key is a contract between a Role Builder
checkbox and an enforced code path — that's why the dictionary is code-owned
and admins can't invent keys at runtime.

Format: `domain_resource_verb`, category = portal domain (drives the Role
Builder accordion grouping). **CRUD-plus, not raw CRUD** — a constrained
verb vocabulary:

| Verb | Meaning | Use when |
|---|---|---|
| `view` | read (list + detail) | almost every resource — read/write split is nearly always governance-relevant |
| `create` | create only | ONLY where maker-checker applies (the maker's half) |
| `manage` | create/update/delete lifecycle | where no realistic role holds one side but not the other |
| `approve` | decision transitions | every governance gate — loans, disbursements, write-offs |
| business verbs (`assess`, `reconcile`, `resolve`, `clear`, `issue`, `terminate`, `archive`, …) | named workflow actions | actions a regulator or process doc would name |

Rules:
- **Litmus test for a separate key:** is there a realistic role that should
  hold one side and not the other? Yes → split; no → fold into `manage`.
  Segregation-of-duties-driven granularity, never entity-schema-driven
  (raw CRUD-per-entity both explodes the checkbox matrix AND collapses
  approve into update, destroying maker-checker).
- **Author keys from user intents, not tables** — for each storyboard
  screen, list the verbs a human performs there; those become keys.
- **When in doubt start coarse** (`view`/`manage`) — splitting later is a
  cheap add-key-and-re-tick migration. Renaming is NOT cheap: code
  references keys as strings, so a rename silently un-guards every endpoint
  using the old name. Add + migrate, never rename.
- Known keys still to add when their features are built:
  `risk_applications_approve`, `dashboard_executive_view` (surfaced by the
  Finance Manager onboarding walkthrough, 2026-07-22).

### Sitemap annotation notation (agreed with Tony, 2026-07-22)

Tony's sitemap inventory (built per domain/subdomain as he designs the
frontend) is the **single authoritative source** for permission keys: if a
node/action is in the sitemap with a key, it's enforceable and grantable;
if it isn't, it doesn't exist. The chain is: annotated sitemap → dictionary
migration → `@RequirePermission` on endpoints → manifest → navigation.

Notation — three annotation types:

```
Finance (domain)
├─ Disbursements                    [gate: finance_payments_view]
│   ├─ Payment detail               [gate: finance_payments_view]
│   │   ├─ btn Approve              [action: finance_payments_approve]
│   │   └─ btn Edit draft           [inherit: finance_payments_manage]
│   └─ Reconciliation queue         [gate: finance_payments_reconcile]
└─ Executive Dashboard              [gate: dashboard_executive_view]
```

- `[gate: key]` — every nav node (domain/subdomain/screen) gets one, almost
  always a `_view`. Drives manifest navigation: node renders only if the
  key is held ("not permitted" = absent, never greyed out/forbidden).
- `[action: key]` — an in-screen action with its own key, ONLY where the
  segregation-of-duties litmus test passes (approve/reconcile/issue/…).
- `[inherit: key]` — ordinary edit/save actions covered by the screen's
  `manage`/`view` key; documents the mapping without minting a new key.
- **Not 1:1**: one key may gate several screens (list + detail); one screen
  may surface one gate + several action keys.
- Work-queue screens also note their queue rule in the sitemap ("status IN
  (…), funderPersonaId scope, assignee = me") — row-level rules stay
  code-side per the flat-keys ruling, and the sitemap is where they're
  specified.

When an annotated inventory lands, Claude's side is mechanical: dictionary
migration for new keys (Tony's domain grouping = permCategory = Role
Builder accordions), `@RequirePermission` on the matching endpoints, and
extending the manifest with the navigation structure (route ↔ gate-key
mapping — the open "design the nav part of the manifest" item). Renaming a
screen in the inventory is free; renaming a shipped KEY is not
(add + migrate, never rename).

### Portal screens — design spec from "Dynanic RBAC.pdf" (not built)

Source: `SQF ARCHITECTURE/Dynanic RBAC.pdf` §3 (UI Component Blueprint & UX
Interaction Rules). Tony's Funder Administration Portal frontend design will
refine layout/visuals, but these interaction rules are the agreed baseline —
build in `apps/web-next` (shadcn/Tailwind, Recharts standard for any charts)
against the existing `/api/rbac` endpoints:

1. **Dynamic Role Builder Workspace** — 30/70 master-detail split. Left:
   role list from `GET roles` + "+ Create New Role". Right: permission
   matrix as accordions grouped by `permCategory` (from `GET permissions`),
   checkboxes per `permKey`. Rules: category header "Select All" toggles all
   children; `permDescription` rendered as inline tooltip text under each
   checkbox label; **dirty-state guard** — intercept route navigation with
   unsaved checkbox changes ("You have unsaved access control changes…").
   Save = `PUT roles/:id/permissions` (whole-set replace).
2. **User Directory & Provisioning Portal** — data grid of org members
   (`GET users`); row click opens a 40%-width slide-out drawer; active roles
   as dismissable token chips (✕ queues removal); **live capability
   preview** — read-only aggregate permission list at the drawer base,
   recomputed client-side as chips change, showing exactly what the user
   will hold if saved. Apply via `POST/DELETE users/:personId/roles[…]`.
3. **Live Security Audit & Session Ledger** — read-only stream from
   `GET audit` (+ auth_audit_log for authentication events). Columns:
   timestamp, user entity, action key, impacted target, IP/geo metadata,
   risk-level badge (traffic-light = shared badge component per the
   dashboard standard, never color alone). **Session kill switch**: red
   "Force Terminate Session" per active-session row →
   `POST users/:personId/revoke-sessions`.

Production-hardening items from the spec deferred to the Terraform phase:
Redis-broadcast cache invalidation (replaces the in-process bust),
INSERT-only DB service account for audit tables, WAF in front of the
services. Rejected from the spec (recorded 2026-07-22): parallel `users`
table (person/organization_person already own identity), async audit
logging (same-transaction writes instead), CASL-style condition jsonb
(row-level stays code-side).

**Note on "multiple tenants" (2026-07-17 ruling, still applies):** in
production each Funder runs in its own isolated deployment — this portal and
these tables are a **per-deployment** feature. Org scoping via the role's
organizationId is defense-in-depth within a deployment (and what makes the
shared dev DB safe), not the production isolation boundary.

### Impact on current development
- New screens and endpoints: guard with `@RequirePermission(<key>)` — never
  hardcoded role checks, never new CASL rules
- Payment microservice: use `@RequirePermission('finance_payments_view'/'…_approve')`
  (already in the dictionary as placeholders)
- Do NOT add new hardcoded rules to casl-ability.factory.ts
- Do NOT add new roles to OrganizationPersonRoleEnum — dynamic roles replace it;
  the enum stays only for the legacy CASL path until retirement

---

### Requirement — role-based dashboard
Each user sees a personalised dashboard showing only the domains,
features and work items relevant to their role. Forbidden errors
must never appear — if a user cannot access something it simply
does not appear in their navigation at all.

### Permissions manifest
**Backend half exists (2026-07-22):** `GET /trade-directory/api/rbac/manifest`
returns identity + permission keys + categories. The navigation-structure and
work-queue parts below are still to be designed with the dashboard.
After login the frontend calls a single backend endpoint that
returns a permissions manifest for that user. The frontend renders
the dashboard from this manifest — no hardcoded role checks in
React components. This means a Super Admin can update a role's
permissions and the affected user's dashboard reflects the change
on their next login with no frontend code change.

The manifest includes:
- User identity (name, role label, avatar)
- Navigation structure (domains, items, routes, permitted: true/false)
- Work queue (items requiring attention today, driven by application
  status and tenant scope)

### Domain structure
The following domains and their target roles define the navigation
architecture:

Credit Risk             → Risk Officer
  Application queue, risk assessment, risk models (view),
  risk profiles (view), KYC agency report view

Client Onboarding       → Relationship Manager
& Relationship Mgmt       Applicant list, application form,
                          client list, site visit reports

Customer Relationship   → RM Team Lead / Admin
Management                Role assignment, client assignee

Document Management     → RM / Risk Officer / Document Officer
                          Document upload, extraction review,
                          document approval (PENDING_REVIEW)

Configuration           → Super Admin
& Administration          Risk models (edit), risk profiles (edit),
                          organisation directory, user management,
                          role management, audit log

Finance                 → Finance Officer (to be built)
                          Transactions, payment processing,
                          ledger view

Compliance              → Compliance Officer (to be built)
                          Compliance checks, audit log

### Work queue design
Each role has a work queue driven by application status and tenant
scope (funderPersonaId). Examples:

Risk Officer queue:
  Applications with status IN (PENDING_RISK_FILTER_1, PENDING_RISK_FILTER_2)
  scoped to the user's funderPersonaId
  ordered by updatedAt ASC (oldest first)
  No assigneePersonId filter — risk officers share a team queue
  and self-assign

Relationship Manager queue:
  Applications with assigneePersonId = this user's personId
  AND status IN (PENDING_CLIENT_SUBMISSION, PENDING_ASSIGNEE_REVIEW)
  ordered by updatedAt ASC

Adding individual assignment within the risk team (senior assigns
to junior) requires a riskAssigneePersonId column on the application
table — design this before implementing if needed.

### Dashboard design principles
1. Personalised per role — each role sees only their domain
2. Navigation driven by permissions manifest from backend
3. No hardcoded role checks in React components
4. Work queue driven by application status + tenant scope
5. Features that are not permitted do not appear — no greyed-out
   or disabled items, no forbidden errors
6. Information architecture must be designed before any code is
   written — get the structure right first

### Dashboard implementation notes for Claude Code
When building the dashboard:
- Design information architecture before writing any code
- The permissions manifest endpoint exists (`/api/rbac/manifest`); extend it
  with the navigation/work-queue structure once the layout is agreed — never
  a hardcoded role map
- Each new microservice (payment, compliance) must register its
  resources in the permissions framework from day one
- The dashboard layout decision (sidebar vs top nav vs domain cards)
  affects the manifest structure — agree on this before building
  the backend endpoint

---

## Authentication & Login Security Requirements

SQF is a licensed financial platform handling loan disbursements. All authentication code must meet the security standards below. These are **go-live requirements**, not aspirational goals.

---

### Token Security (Priority Order)

**Priority 1 — Hashed refresh tokens (implement first)**
- Never store raw tokens in the database.
- Store only bcrypt.hash(refreshToken, 10) in a refreshTokenHash varchar column.
- Compare using bcrypt.compare() on each refresh call.
- Eliminates database breach impact on active sessions.

**Priority 2 — Refresh token rotation**
- On every /auth/refresh call: delete the old token hash, issue and store a new one.
- The client must replace its stored refresh token on every successful refresh response.
- Detects token theft — a replayed token will fail because it has already been rotated out.

**Priority 3 — httpOnly cookies (coordinated frontend + backend change)**
- Move the refresh token out of Redux/localStorage into an httpOnly, Secure, SameSite=Strict cookie.
- Keep the access token in memory only (React state / closure) — never persist to localStorage.
- This is required by Bank Negara Malaysia internet banking security guidelines.

**Priority 4 — Token family tracking (full RFC 6749 model)**
- Assign each login session a familyId.
- If rotation detects reuse of an already-rotated token (stolen token replayed), invalidate **all** sessions for that user and send a security alert email.

---

### Brute Force & Rate Limiting

- Use @nestjs/throttler to rate-limit the /auth/login endpoint.
- Policy: maximum 5 failed attempts per account per 15-minute window.
- After 5 failures: lock the account, log the event, and email the account owner immediately.
- Rate limit by both IP address and account identifier to resist distributed attacks.

---

### Multi-Factor Authentication (MFA)

- TOTP-based MFA (compatible with Google Authenticator / Authy) is required for all user roles that can initiate or approve disbursements.
- On first login after MFA is enabled, present a QR code generated with otplib.
- Store only the TOTP secret (encrypted at rest), never the OTP code.
- Bank Negara will ask about MFA — it must be present before licensing review.

---

### Audit Logging (Append-Only)

Create a dedicated auth_audit_log table. Log the following events with timestamp, userId, ipAddress, userAgent, and outcome:

- Login attempt (success and failure)
- Token refresh
- Password change or reset
- Account lockout triggered
- MFA verification (success and failure)
- Logout

This table must be append-only — no UPDATE or DELETE permissions on it. It is the evidence trail for regulatory audits.

---

### Password Policy

Enforce at registration and password-change time:

- Minimum 12 characters, must include uppercase, lowercase, number, and symbol.
- Check the submitted password against the HaveIBeenPwned API (k-anonymity model — only the first 5 chars of the SHA-1 hash are sent, no plaintext leaves the server).
- Reject any password found in the breach database.
- Block common patterns: sequences, repeated characters, the application name.

---

### Transport & CORS

- All traffic must be HTTPS. No HTTP fallback permitted in any environment except local development.
- Set Strict-Transport-Security: max-age=31536000; includeSubDomains on all responses.
- CORS must be locked to the exact frontend origin — no wildcards (origin: '*' is not acceptable in any non-local environment).
- Audit the NestJS CORS config at main.ts before each environment promotion.

---

### Login Anomaly Detection (Post Go-Live)

- Flag logins from a country or device not seen in the user's last 30 days.
- Before allowing any disbursement action in the flagged session, require re-verification (email OTP or MFA).
- This is the highest-effort item and may be deferred to the first post-launch sprint, but must be in the roadmap.

---

### Implementation Priority Summary

| Priority | Item | Effort | Mandatory for Go-Live |
|---|---|---|---|
| 1 | Hashed refresh tokens | ~4 hours | Yes | ✅ Done |
| 2 | Refresh token rotation + token family tracking | ~1 day | Yes | ✅ Done |
| 3 | Rate limiting + account lockout | ~1 day | Yes | ✅ Done |
| 4 | Audit logging (auth_audit_log) | ~1 day | Yes | ✅ Done |
| 5 | HTTPS + HSTS + CORS lockdown | ~½ day (config) | Yes | |
| 6 | Password policy + breach check | ~1 day | Yes | |
| 7 | httpOnly cookies (backend + frontend) | ~3 days | Strongly recommended | ✅ Done |
| 8 | MFA (TOTP) | ~2–3 days | Yes (for disbursement roles) | |
| 9 | Lockout alert emails | ~½ day | Yes | ✅ Done |
| 10 | Login anomaly detection | ~1 week+ | Post go-live roadmap | |
