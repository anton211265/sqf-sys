# LCM Removal — Assessment

> **Status: EXECUTED 2026-07-12** (after the Experian→KYC rename, per Tony's sequencing). Deviations from the plan below, found during removal:
> - `ApplicationSupportingDocument` (risk-operation) was **kept** — it's SQF-era, not LCM: the live `financial-credit-report` module relates to it (the G-checklist caught this).
> - `apps/risk-operation/test/mock/financial-credit-report.mock.ts` kept — imported by the live SQF financial-credit-report service.
> - The trade-directory KYC (ex-Experian) module was kept whole — its only controller is the Kafka consumer; there were no legacy HTTP routes to strip.
> - MSAL leftovers (`sub`, `preferredUsername`, the Entra AUTHENTICATE path in auth.service) **not removed** — still woven into live auth code; spun off as a separate task.
> - `person/me` returns 401 for the SQFSYS account (JWT strategy rejects `orgId: 0`) — **pre-existing**, not caused by this removal.
> - document-management's crash-loop (missing `ps` in bookworm-slim, broke `nest --watch`) was pre-existing; fixed by adding `procps` to its Dockerfile.
> - DDL applied: `docs/design/migrations/003-lcm-removal.sql` (trade-directory), `004-lcm-removal-risk-operation.sql` (risk-operation).

Requested by Tony 2026-07-12: "LCM does not exist anymore, all references to LCM should be removed. Do an assessment first."

LCM is the legacy loan-case-management product (New Horizons era) that sqf-sys was built alongside. The newer SQF modules (`sqf/` folders, `/api/*` routes, `screens/SQF/`) were added next to it, with `// LCM //` comment markers fencing the old code. **The markers are unreliable in both directions** — live code sits inside LCM blocks (`SEND_EMAIL` topic, `person.systemRole`, `failedLoginAttempts`) and the App.tsx "LCM ROUTES" block contains the SQF SystemSetup route and the global catch-all. Everything below was verified by tracing actual callers, not by trusting the markers.

Only 22 literal "LCM" strings exist, but the legacy subsystem they fence is ~20k LOC + a 394k-line data file.

---

## A. Frontend — delete (≈11,200 LOC)

| Item | Size | Evidence it's dead |
|---|---|---|
| `screens/Client/` (ClientApplicationForm, ConsentForm, ApplicationSummary) | 2,568 | Only reachable via LCM routes; calls legacy `application-public` endpoints |
| `screens/Forms/` (E1/E2 form packs) | 6,438 | Only imported by legacy screens |
| `screens/RM/` (ApplicantList, ClientList, ClientDetails, NewApplication, EmailPreview) | 1,173 | Calls legacy endpoints only |
| `screens/Risk/` (ApplicationList, AssessmentMain, AssessmentOverview) | 763 | Same |
| `screens/RoleAssignment/` | 252 | Same |
| `components/Layout/` + `components/Nav/` (legacy chrome) | — | `Layout` imported only by App.tsx for legacy routes; SQF uses `AdminLayout`/`AuthenticatedRoute` |
| App.tsx LCM route block | — | **Except:** keep SystemSetup route, `/onboarding` + `/client-dashboard` redirects, and catch-all — move them out of the block. Delete the `/applicant/:id`, `/risk/:id` user-manual redirects (they target deleted routes) |
| routes.tsx `NAV` + most of `PUBLIC` | — | **Except** `PUBLIC.LOGIN: ''` — it's the catch-all/login target used by live code (`Login.tsx`, guards). Move to the SQF section |

No SQF screen navigates to any legacy route (verified: only App.tsx + legacy Nav.tsx reference them). Login.tsx role-redirects all target SQF routes.

**Stays:** `axiosClient` — despite CLAUDE.md calling it "the LCM client", it's used by Login, SystemSetup, RoleAssignment→(deleted), `service/login|logout`, and `reactQuery.ts`. Live infrastructure.

## B. trade-directory backend — mostly delete (≈5,400 LOC in LCM modules)

| Module (route prefix) | Verdict |
|---|---|
| `organization` (`/organization` + Kafka CREATE/UPDATE_ORGANIZATION handlers) | Delete — HTTP callers are all legacy screens; Kafka producers are risk-op's LCM modules (also deleted) |
| `organization-person`, `person` (`/person`), `bank-account`, `person-supporting-document` | Delete — legacy callers only |
| `client-persona`, `contract-awarder-persona`, `supplier-persona`, `factor-persona` CRUD modules | Delete modules; **keep the entities** (core taxonomy, used by Organization relations, auth, SQF org queries). Fewer files to rename in Phase 1a/1c |
| `application-public` | Delete — serves the deleted public-link application flow |
| `experian` | **Split.** Delete the legacy HTTP controller routes; **keep** `ExperianService`, parser, repository, and the Kafka `REQUEST_EXPERIAN_REPORT` consumer / `RECEIVE_EXPERIAN_REPORT` producer — `SqfExperianModule` (`/api/experian`, used by Admin OrganizationView) imports them. Only SQF↔LCM dependency in the codebase |
| `Transaction` entity + repository + `seed-gl.ts` + **`scripts/data/gl.json`** | Delete. gl.json is 394,328 lines of **real LCMSB general-ledger data** (client names, disbursements, bank transfers) — sensitive, shouldn't be in the repo at all. It's in the initial commit's history; consider that when the repo ever goes to a shared remote |
| Entity field cleanup | `person.bankAccounts/personSupportingDocuments` relations go; **keep** `systemRole`, `failedLoginAttempts`, `lockedUntil` (live auth fields mis-fenced inside the LCM block) |

## C. risk-operation backend — delete (≈3,200 LOC)

- `application/` module (1,668 LOC) and `application-public/` module (1,564 LOC): zero imports from `sqf/` modules; HTTP callers are all deleted screens. SQF onboarding posts to `/risk-operation/api/applications` (sqf module) instead.
- `application.entity` LCM section (lines ~135–414, most of the entity): relations to `ClientAwarderContract`, `Facility`, `ApplicationPublic`, etc. `sqf/` never references them (verified for ClientAwarderContract; full field-by-field check at removal time). Delete fields + `client-awarder-contract.entity`, `facility.entity`, `application-public.entity`.

## D. libs/common — delete the dead, keep the live

- Delete: `CreateOrganizationMessage`/`UpdateOrganizationMessage` types, `UpdatableOrganization`, `ApplicationPublicGuard` + decorator + DTOs, Kafka topics `CREATE_ORGANIZATION(_REPLY)`, `UPDATE_ORGANIZATION(_REPLY)`.
- Keep (live, inside "LCM" markers): `SEND_EMAIL`, `CREATE_CLIENT_ASSIGNEE`, `REQUEST/RECEIVE_EXPERIAN_REPORT`, `ReceiveExperianReportMessage`. Remove the misleading LCM comment fences.

## E. Consequences to accept (flagging before I touch anything)

1. **The Experian Kafka round-trip goes dormant.** The only producer of `REQUEST_EXPERIAN_REPORT` is risk-op's LCM `application-public.service`, and the only consumer of `RECEIVE_EXPERIAN_REPORT` is the same module. After removal, trade-directory can still *serve* stored reports (`/api/experian`, seed scripts keep working) but nothing *requests* new ones. Fine for the redesign — Phase 1b renames the topics to KYC and the new trade directory re-introduces the trigger — but between now and then, no new bureau reports flow.
2. **CRM goes dormant.** The only producer of `CREATE_CLIENT_ASSIGNEE` is risk-op's LCM `application.service`, and the only screen showing client assignees (`ClientList`) is deleted. The CRM service keeps running healthily (its consumer just never fires) until the redesigned flows repopulate it. Recommend leaving it in compose untouched.
3. **Legacy flows disappear from the UI**: applicant/risk queue, legacy client list, public application links (`/client-application/:id` etc.), site visit, role assignment — flows 7–10 in the frontend baseline. Their replacements are the Phase 3 redesigned screens + the planned role-based dashboard.
4. **MSAL leftovers are adjacent, not identical**: `organization_person.sub` and `person.preferredUsername` are still read by live-looking code paths in `auth.service.ts` (~lines 687–806, an MSAL-era token path) and surfaced in SQF DTOs/web types. Removing them safely needs auth-flow verification — I'd fold it into this cleanup as its own verified step, not a blind delete.
5. **Dead DB tables**: `transaction`, `bank_account`, `person_supporting_document`, `client_awarder_contract`, `facility`, `application_public`. Pre-production, so I recommend an explicit DROP TABLE migration script rather than leaving zombie tables.

## F. Why do this before Phase 1 renames

Removing LCM first shrinks every rename: the `contract-awarder-persona` CRUD module gets deleted instead of renamed (only the entity + relations rename in 1a), the legacy experian controller is deleted instead of renamed in 1b, and dozens of factor-references disappear before 1c. Proposed order: **Phase 0 = LCM removal → gate (all services healthy, login + SQF flows E2E) → Phase 1a/1b/1c as planned.**

## G. Verification checklist for removal time

- [ ] Field-by-field check of `application.entity` LCM section against `sqf/` usage before deleting fields
- [ ] Confirm `run-seed-mock-data.ts` doesn't orchestrate deleted seeds (`seed-gl.ts`)
- [ ] Confirm experian seed scripts (`seed-*-experian-report.ts` + bi/ci/cris json data) still compile after module split — they stay (they feed the live `/api/experian` read path)
- [ ] Trace `auth.service.ts` MSAL path before removing `sub`/`preferredUsername`
- [ ] `docker compose` full restart + 5-service health check + login/system-setup/onboarding/admin E2E (real infra, no mocks)
- [ ] Update CLAUDE.md (axiosClient description, Kafka topic table, LCM mentions) and the frontend-baseline memory
