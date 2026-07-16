# sqf-sys — Claude Code Reference

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

sqf-sys is a financial platform (supply-chain finance / invoice factoring) built as an Nx monorepo. It has 6 NestJS microservices and a React/Vite frontend.

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

### Run seed script (SQFSYS bootstrap account)
```bash
docker compose exec trade-directory-service \
  npx ts-node -r tsconfig-paths/register \
  apps/trade-directory/src/scripts/seed-funder.ts
```

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

### Auth Flow (email/password)
1. `POST /trade-directory/auth/organizations` — returns orgs for the email
2. `POST /trade-directory/auth/login` — returns `{ accessToken, refreshToken }`
3. Tokens stored in cookies (`access_token`, `refresh_token`) via `js-cookie`
4. `GET /trade-directory/api/person/me` — returns logged-in person profile

Microsoft SSO (MSAL) has been removed from the platform. Email/password JWT is now the only auth flow, frontend and backend.

Frontend uses two axios clients, both JWT-cookie-based now that MSAL is gone:
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
| risk-operation | SEND_EMAIL | — |
| trade-directory | RECEIVE_KYC_REPORT, SEND_EMAIL, ORGANIZATION_CREATED | REQUEST_KYC_REPORT |
| customer-relationship-management | — | CREATE_CLIENT_ASSIGNEE |
| notification | — | SEND_EMAIL |
| document-management | — | SQF_DOCUMENT_EXTRACTION |
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

### Related-party attributes (director, shareholder, product, ...) are a graph-computed pattern, not a `relationship` row (decided 2026-07-14)

Shared director, shared shareholder, same lending product, and other common-attribute links between two organizations are **not** modeled as rows in the Postgres `relationship` table. `RelationshipTypeEnum` stays limited to the directional trade type it already has (`SUPPLIES_TO`); its own code comment already anticipated this — `SUBSIDIARY_OF`/`SHARES_DIRECTOR_WITH` are marked "reserved for later (knowledge-graph driven)". This decision confirms and generalizes that: any "these two orgs are connected because they share X" fact is a **computed graph pattern in knowledge-graph (Neo4j)**, discovered by querying the projected data, not an explicit row anyone inserts.

**Why:** `relationship.fromOrganizationId`/`toOrganizationId` model a directional trade flow (supplier→buyer) — a shared director or shareholder is symmetric, so it doesn't fit that shape without either faking a direction or double-storing the pair. There's also no reliable trigger moment for it the way invoice creation states issuer/debtor directly: a shared director is *derived* by joining `OrganizationPerson` rows across two `organizationId`s, and `OrganizationPerson.designation` is free text today (`"Director"`, `"Managing Director"`, ...), not a structured field — no create()-time hook to hang this on. And it's a related-party/conflict-of-interest signal (Bank Negara relevance), not a trade fact, so it shouldn't silently look like one in the trade graph.

**How to apply:** when this gets built, it means (1) projecting `Person` nodes and `Person -[:MEMBER_OF {designation}]-> Company` edges into Neo4j (trade-directory doesn't currently emit any event when `OrganizationPerson` rows change — a new topic/consumer would be needed, mirroring the existing `RELATIONSHIP_UPSERTED`/`CONTRACT_UPSERTED`/`INVOICE_STATUS_CHANGED` pattern), (2) structuring shareholder data as real entities/edges rather than the free-text/jsonb blob currently buried in `KycAgencyReport.shareholders`, and (3) projecting `LendingProductSubscription` so "same product" is a graph pattern too. The actual "shared director" fact is then a Cypher query (e.g. two `Company` nodes reachable from the same `Person` node via `MEMBER_OF`), exposed through the existing GraphRAG opportunities API pattern (`apps/knowledge-graph/src/opportunities/`) — not a new Postgres migration. Not built yet; this is a design decision only.

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
- **No per-domain design-system page overrides.** The `ui-ux-pro-max` plugin's auto-generated per-page overrides (credit-risk, finance, compliance, etc.) were reviewed on 2026-07-07 and discarded — they resolved to generic e-commerce/marketing templates (checkout flows, product-review pages, lead-gen forms) unrelated to sqf-sys's internal authenticated screens, with some files duplicated verbatim across unrelated domains. For actual page structure per domain, use the Domain structure and work-queue design already specified by hand below (Planned: Dynamic RBAC, Multi-Tenancy and Role-Based Dashboard section) — not any auto-generated page file.

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
- 1 critical + 7 high npm vulns remain in `@hashgraph/sdk` transitive deps

---

## Security Model — Authentication

### Token lifecycle

1. **Login** (`POST /trade-directory/auth/login`)
   - Server bcrypt-compares the submitted password.
   - On success: issues a short-lived **access token** (15 min JWT) and a long-lived **refresh token** (7-day JWT).
   - Access token returned in the JSON response body.
   - Refresh token set as an **httpOnly, Secure, SameSite=Strict cookie** (`refresh_token`, path `/trade-directory/auth`). It never appears in the response body and is invisible to JavaScript — XSS cannot steal it.
   - A bcrypt hash of the refresh token is stored in the `token` table alongside session metadata (`issuedAt`, `expiresAt`, `userAgent`, `ipAddress`, `tokenFamilyId`).
   - `failedLoginAttempts` and `lockedUntil` are reset to 0 / null on success.

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
| 5 consecutive wrong passwords | Account locked for 15 minutes (`lockedUntil`). Lockout alert email sent via Kafka outbox. |
| Account locked and login attempted | 429 returned with seconds remaining. Logged as `LOGIN_BLOCKED`. |

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

sqf-sys currently only runs in local dev (`docker compose` + Vite). Once local-dev build-out is complete, the next phase is standing up **production infrastructure on AWS** and **CI/CD**, with Claude Code acting as build-time Engineering Orchestrator (per [AGENT.md](AGENT.md)) helping Tony design and build it — not just code review it.

**IaC tool: Terraform.** All AWS infrastructure is defined as Terraform, not manual console/CLI changes — `plan` reviewed before every `apply`, consistent with the human-sign-off gate in [AGENT.md](AGENT.md).

Expect this phase to cover (none of it exists yet):
- AWS account/infra design for the 5 NestJS microservices + React/Vite frontend + Postgres (one DB per service) + Kafka — likely ECS/Fargate or EKS, RDS per service, MSK or a managed Kafka equivalent, S3 (already used for document storage), ALB/CloudFront for the frontend. All provisioned via Terraform.
- CI/CD pipeline (GitHub Actions or equivalent) — build, test, deploy per service (including `terraform plan`/`apply` steps), since there's currently no `.github/workflows` and no automated pipeline at all.
- Closing the open security items above before going live: real TLS/HTTPS, `httpOnly` cookies, secrets management (AWS Secrets Manager / Parameter Store instead of `.env` files), resolving the `@hashgraph/sdk` vulns.
- This also satisfies the Release Agent and Migration Agent roles described in [AGENT.md](AGENT.md) (`agents/deploy/`), which are currently specs only, not implemented — building real CI/CD is what gives those agents something to actually run.

**Sequencing:** do not start this until Tony explicitly says local dev is feature-complete — this is a roadmap note, not a current task.

---

## Multi-Tenancy & Data Governance (Future SaaS Phase)

sqf-sys is moving toward multi-tenant SaaS — multiple unrelated client organizations on one platform, served partly by [domain product agents](AGENT.md) (Risk, Sales & Customer Management, Payment, Finance & Accounting). These principles govern that phase and apply to every product agent's design from the start, not as a later retrofit:

1. **Tenant data isolation, with a Tony-level exception.** A product agent may never share another tenant's data or "experience" (learned patterns, extracted context, prior decisions) with a customer it is not contracted with. Cross-tenant leakage is a hard boundary, not a tunable setting. The one exception: agents may share **consolidated** (aggregated/anonymized, not raw per-tenant) experience and data with Tony, e.g. for platform-wide tuning, eval, and oversight. "Consolidated" means tenant-attributable detail has been stripped or aggregated away before it reaches that channel — a per-tenant record is never an acceptable substitute for a consolidated one.
2. **Daily reporting cadence for product agents.** Each product agent must produce a consolidated daily report to its human supervisor, delivered in both written and verbal form — modeled on a 15-minute daily scrum. This is an operational requirement on every domain agent's harness (see the Observability Agent and the agentic SDLC's "observe & iterate" phase in [AGENT.md](AGENT.md)), not optional telemetry.
3. **Extensible, tenant-agnostic data architecture.** Because SQF will run financial services SaaS for multiple clients, the data architecture must be designed so onboarding/migrating a new customer's data onto the platform is low-complexity and fast — not a bespoke schema or pipeline per tenant. Favor shared, parameterized schemas and migration tooling over one-off per-tenant customization from the outset.

**Status:** governance principles only — no multi-tenancy implementation exists yet (current per-service Postgres databases are single-tenant). Apply these as design constraints once multi-tenant work starts; do not treat their absence from the current schema as a gap to fix today unless Tony asks.

---

## Marketing Agent (Synlian Organization, New)

A new [Marketing Agent](agents/growth/marketing-agent/AGENT.md) has been added to the Synlian Data@Source org under a new cross-cutting **Growth** group in [AGENT.md](AGENT.md) — sibling to Build/Deploy/Operate/Governance/Target Domain Agents, but not gated by or gating the sqf-sys product SDLC.

- **Scope:** the marketing website (distinct from the product's own `apps/web`), promotional video scripting, social media marketing campaigns, and market research for SQF's go-to-market.
- **Status:** design phase, no production autonomy.
- **Key constraint:** because its output is public-facing (publishing, posting, ad spend), it inherits the "Explicit permission required" treatment from Claude Code's own safety rules — no autonomous publish/post/spend until Tony explicitly raises its autonomy tier, and any regulated financial-promotion claim requires Policy Agent + Tony sign-off first.

---

## Document Conversion (Markitdown)

[Microsoft Markitdown](https://github.com/microsoft/markitdown) converts Word/Excel/PowerPoint documents to Markdown before LLM extraction. Markdown is far cheaper in tokens than raw OOXML-derived text and preserves structure (tables, headings) better than naive extraction.

**Status: implemented in `document-management`. AWS Textract OCR has been fully removed** — Markitdown is now the only document-conversion path for every supported mime type (PDF, PNG, JPEG, DOCX, XLSX, PPTX). `initiateDocumentExtraction()` in [document-extraction.service.ts](apps/document-management/src/modules/document-extraction/document-extraction.service.ts) converts the file via [markitdown.service.ts](apps/document-management/src/modules/markitdown/markitdown.service.ts) synchronously on upload and writes the result straight into `rawText`, with status set directly to `PENDING_LLM_EXTRACTION`. The `ocr` module, `OCR_SERVICE`, `PENDING_OCR` status, `handlePendingOCRCron`, and the `@aws-sdk/client-textract` dependency are all gone.

**Vision-LLM fallback for documents with no text layer (implemented 2026-06-25):** Markitdown does **not** do OCR. Its image converter only reads EXIF metadata (no text extraction); its PDF converter (`pdfminer.six`) only extracts text from PDFs that already have an embedded/selectable text layer. For PDF/PNG/JPEG, if Markitdown's output is below `MIN_VIABLE_TEXT_LENGTH` (20 non-whitespace chars) in [document-extraction.service.ts](apps/document-management/src/modules/document-extraction/document-extraction.service.ts), the file is re-sent through [vision-extraction.service.ts](apps/document-management/src/modules/vision-extraction/vision-extraction.service.ts), which calls Claude (`@anthropic-ai/sdk`, PDF via the `pdfs-2024-09-25` beta, images via the standard `image` content block) to transcribe the page images to Markdown.

**This is a generative transcription, not deterministic OCR — it has no confidence score and can misread fields, especially numeric ones (amounts, account numbers).** Per Tony's decision (2026-06-25), the result is therefore **not** trusted automatically: the row is set to a new `PENDING_REVIEW` status (added to `DocumentExtractionStatus`) instead of `PENDING_LLM_EXTRACTION`, and a human must call `POST /extraction/:requestId/approve` (or the future review UI) before the document proceeds to LLM field extraction. `extractionMethod` (`markitdown` | `vision_llm`) is stored on the row and returned in both the list and single-fetch API responses so reviewers can see which path produced the text. **Guardrails — the review workflow itself — are intentionally minimal for now** (a bare approve endpoint, no review UI, no confidence scoring, no audit trail beyond the status change) and are expected to be built out later, consistent with the [AGENT.md](AGENT.md) confidence framework's "below threshold → human review" principle.

Requires `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` env vars (same convention as `apps/risk-agent`).

**Why Markitdown needs Python, and why the base image changed:** Markitdown is a Python package (no Node runtime). Its `magika` dependency requires `onnxruntime`, which has **no Alpine/musl wheel** — `document-management`'s [Dockerfile](apps/document-management/Dockerfile) base image was changed from `node:18-alpine` to `node:18-bookworm-slim` (glibc) for this reason. Every other sqf-sys service stays on `node:18-alpine` unless it also needs Markitdown.

**Install pattern (apply to any new service needing Markitdown):**
- Local/Docker: `apt-get install python3 python3-venv`, then `python3 -m venv /opt/markitdown-venv && /opt/markitdown-venv/bin/pip install 'markitdown[docx,xlsx,pptx,pdf]'`. Use the `[docx,xlsx,pptx,pdf]` extras, not `[all]` — `[all]` pulls extra OCR/audio dependencies that aren't needed and don't change the Alpine-incompatibility either way.
- Install at a fixed path outside `WORKDIR` (e.g. `/opt/markitdown-venv`) so the same `MARKITDOWN_BIN_PATH`-style env var works across every Dockerfile stage/target, regardless of each stage's own `WORKDIR`/copy layout.
- **Never install into global/system Python** on a dev machine — it silently upgrades shared packages (pillow, protobuf) and can break unrelated Python projects (this happened once with a global install clashing with `streamlit`). Always use an isolated venv.
- Invoke via `child_process.execFile` (not `exec` — avoids shell injection) from the Node service, passing the file path as an argv element, never interpolated into a shell string.
- Apply this pattern to any sqf-sys service or future Synlian Data@Source project that converts Word/Excel/PDF/PowerPoint for LLM processing.

## Proto / gRPC Layer

`libs/common/src/apps/trade-directory/proto/entity.ts` contains proto-generated enums. When adding a new value to `libs/common/src/apps/trade-directory/enums/organization-person-role.enum.ts`, also add it to:
1. `proto/entity.ts` — `OrganizationPersonRoleEnum`
2. `proto-converter.ts` — both `convertToApp` and `convertToProto` maps
3. `apps/web/src/constants/enum.ts` — frontend enum

## Planned: Frontend Rebuild — Full Rewrite, Mantine Removed (scoped 2026-07-15)

Tony has decided sqf-sys's frontend will be completely rebuilt, not
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

## Planned: Dynamic RBAC, Multi-Tenancy and Role-Based Dashboard

### Current state — permissions
Permissions are hardcoded in
libs/common/src/modules/casl/casl-ability.factory.ts.
Roles and what they can do are written by a developer and require a
code change and redeployment to update. Several roles exist in
OrganizationPersonRoleEnum but have no CASL rules yet:
- RISK_OFFICER (no rules)
- CLIENT / borrower (no rules)
- SQFSYS (no rules)

### Requirement — dynamic RBAC
The system will support multiple tenants. Each tenant (Funder
organisation) must be able to configure their own permission sets
through a Super Admin portal without requiring a code change or
redeployment.

A Super Admin will access a dedicated admin portal and perform
three functions:
1. User management — create internal staff accounts, set credentials,
   assign users to the organisation
2. Role management — define roles and configure exactly what each
   role can do (which actions on which resources with which conditions)
3. Role assignment — assign one or more roles to a user

### Role design decision
Use global role names with tenant-specific permissions (Option B).
Every tenant shares the same role names (RISK_OFFICER, CLIENT_COVERAGE
etc.) defined in OrganizationPersonRoleEnum, but each tenant's Super
Admin configures what those roles can do independently. Do NOT build
fully custom role names per tenant at this stage — that can be added
later when genuinely needed.

### Database changes required (future sprint)
A new role_permission table is needed:

role_permission
──────────────────────────────────────────
id               PK
funderPersonaId  int     (tenant scope — each tenant owns their rules)
roleName         varchar (e.g. RISK_OFFICER)
action           varchar (create/read/update/delete/manage)
subject          varchar (Application/ClientAssignee/all)
conditions       jsonb?  (e.g. { "assigneePersonId": "{{userId}}" })
createdAt / updatedAt

Every write to role_permission and organization_person_role must be
timestamped and attributed to the Super Admin who made the change
(audit log — Bank Negara compliance requirement).

### CaslAbilityFactory update required
CaslAbilityFactory must be updated to load rules from the
role_permission table at runtime, scoped to the current user's
funderPersonaId, instead of reading from hardcoded if/else blocks.

### Current tables that already support this design
These tables exist in trade-directory and will be driven by the
new admin portal UI:
- organization_role — role definitions per org
- organization_person_role — user-to-role assignments
- organization_person — user membership per org

### Impact on current development
- Token/auth refactor (Stages 1-5 in CLAUDE.md): not affected,
  proceed as planned
- Payment microservice: when adding permission checks, use a
  stub/placeholder that reads from the future role_permission table
  rather than adding new hardcoded CASL rules
- New screens and endpoints: add a comment documenting which role
  should have access, but do NOT implement as hardcoded CASL rules
- Do NOT add new hardcoded rules to casl-ability.factory.ts
- Do NOT add new roles to OrganizationPersonRoleEnum without a
  corresponding database-driven permissions design

---

### Requirement — role-based dashboard
Each user sees a personalised dashboard showing only the domains,
features and work items relevant to their role. Forbidden errors
must never appear — if a user cannot access something it simply
does not appear in their navigation at all.

### Permissions manifest
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
- The permissions manifest endpoint must be built in trade-directory
  alongside the dynamic RBAC work — not as a hardcoded role map
- Each new microservice (payment, compliance) must register its
  resources in the permissions framework from day one
- The dashboard layout decision (sidebar vs top nav vs domain cards)
  affects the manifest structure — agree on this before building
  the backend endpoint

---

## Authentication & Login Security Requirements

New Horizons is a licensed financial platform handling loan disbursements. All authentication code must meet the security standards below. These are **go-live requirements**, not aspirational goals.

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
