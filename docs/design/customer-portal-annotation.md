# Customer Portal — Phase-2 Annotation (pass 1: Onboarding Funnel)

Status: **APPROVED by Tony 2026-07-24 — all six questions confirmed
(scope; org-membership authorization; adopt-and-extend application table;
static KYC doc sets v1; Malaysia dev disclaimer; dev applicants bind to
org 2). Pass-1 build started same day.**
Sources: SQF Blueprint_HLD §1 (New Application flows), §2/§3 Customer Portal
sitemap + detailed notes; `SQF ARCHITECTURE/customer_portal.docx`; Tony's
standing rulings (2026-07-24): clients authenticate with passkeys on the same
infra; Customer Portal is a SEPARATE app; eKYC = buy-not-build vendor Web SDK
with a mock provider for local dev; bank-country match + corporate-email
rules are per-funder policy config (already built in product-configurator).

## Why pass 1 = the onboarding funnel

Tony ordered the portal before the Provisional Offer workspace because CRC
needs real applications. The slice that unblocks everything downstream is:
**new-user application → disclaimer → account + passkey → onboarding wizard →
document submission → bank account → director eResolution/eKYC → submit →
Filter-1 default risk profile scores it → applicant lands in the RM
Supervisor queue (pass/fail) → passed applications land in the CRC bucket.**
That activates three existing placeholders in one stroke: CRM "new
applicants (web)", CRC "new application bucket", and the RM 10-working-day
fail-engagement flow.

The post-onboarding product workspaces (Global Dashboard, AR/IF/SCF/TL tabs,
disputes workbench, predictive alerts, batch export) are pass 2+ — they
depend on Operations/Finance domains that don't exist yet. The docx's two
open dispute questions (freeze whole debtor vs single invoice; partial
disputes) are parked with that pass.

## App architecture (pass 1)

- **New app `apps/customer-portal`** — Vite/React/TS on port **3003**, same
  chassis as web-next (single axiosClient with in-memory access token +
  refresh-cookie rotation, redux-persist identity, React Query,
  shadcn/Tailwind primitives). No PortalLayout/manifest — the portal has its
  own thin client shell.
- **Third origin plumbing:** nginx CORS map regex gains 3003 (the map is the
  enforcing layer — .env alone does nothing); every service's
  `FRONTEND_DOMAIN` gains `http://localhost:3003`; `WEBAUTHN_ORIGINS`
  extended. Enrollment/QR link base stays 3002 for staff — portal enrollment
  links must carry the 3003 origin explicitly (new `linkBase` parameter on
  the issue path, never guessed from FRONTEND_DOMAIN order).
- **Authorization model — NOT the funder permission dictionary.** Portal
  users are `person` rows with `organization_person` membership in their own
  applicant/client organization. Gating = membership in the org whose data
  is requested + (later) the authorized-signatory designation from
  eResolution. No `permission` keys are minted for clients; the docx's
  "granular permissions separating data entry from funding approvals"
  arrives with the workspaces pass as per-org designations. Funder-side
  screens keep using existing keys (onboarding_applicants_view etc.).

## Pass-1 sitemap (portal side — gating is membership, not keys)

```
Customer Portal (public origin :3003)
├─ Landing / Login (passkey; same auth endpoints)          [public]
│   └─ btn "New user application"
│       ├─ Legal disclaimer                                 [public]
│       │    scroll-to-accept enforced; dual checkboxes (Terms & Credit
│       │    Check Authorisation | Data Privacy Consent); immutable
│       │    acceptance record {timestamp, IP, email, disclaimerVersion}
│       ├─ Corporate email capture                          [public]
│       │    validated against the funder's corporate-email blocklist mode
│       │    (funder_config_settings — already built)
│       └─ Account creation → enrollment link emailed (24h, single-use)
├─ Enroll (passkey, /enroll#token=…)                        [public+token]
└─ Application Workspace (authenticated, own-org only)
    ├─ Onboarding progress tracker (wizard shell, resumable)
    ├─ 1. Company profile (corporate entity manual data entry)
    ├─ 2. Product selection (AR / SCF / IF / TL — active products only)
    ├─ 3. Application form (product-specific parameter set from §1:
    │      financial metrics, customer & ledger profile, TL loan request)
    ├─ 4. KYC documents (checklist per selected product; statuses
    │      Missing → Pending Review → Approved / Rejected(reason);
    │      drag-and-drop dropzone, 25MB, format rules per class —
    │      uploads go to document-management)
    ├─ 5. Settlement bank account (IBAN pos 1-2 + SWIFT pos 5-6 country
    │      extraction; must match registered country per the funder's
    │      bankCountryMatch policy mode; non-IBAN jurisdictions toggle
    │      to RTN/domestic account + SWIFT-only check)
    ├─ 6. Director eResolution + eKYC
    │      ≥2 directors sign; names must exactly match director rows from
    │      registration documents; single-director companies skip the
    │      resolution but the sole director still does passport + liveness.
    │      eKYC = vendor Web-SDK slot with MOCK provider in dev (passport
    │      photo → Claude vision MRZ name extract → deterministic-first
    │      match, Claude judge for fuzzy, CO review queue on mismatch;
    │      liveness result stubbed by the mock provider)
    └─ 7. Review & submit → acknowledgment email → status page
           (application status visible read-only after submission)
```

## Funder-side activations (existing screens, existing keys)

- CRM SupervisorDashboard "New applicants (web)" placeholder becomes a real
  queue: submitted applications with Filter-1 result badge (PASS/FAIL,
  labeled), assign-to-RM action (crm_assignees_manage).
- RM fail-engagement flow: FAIL → RM engages offline; RM may flip
  fail→pass (recorded in the system log per blueprint); 10 working days
  without a flip → application closed + archived (SLA engine timer +
  breach consumer, same pattern as offers).
- CRC Dashboard "new application bucket": passed (or RM-flipped)
  applications, oldest first (risk_applications_view; pickup =
  risk_applications_assess) — the queue the Provisional Offer workspace
  will consume next.

## Backend plan

- **Application record: adopt-and-extend risk-operation's existing
  `application` table** (it already anchors the Filter-1 scoring chain and
  the verify script). Add funder scope, product code, applicant org id,
  the §1 form parameter sets (jsonb per product), web-intake statuses
  (add-only enum values: SUBMITTED, SCORED_PASS, SCORED_FAIL,
  RM_ENGAGEMENT, CLOSED_ARCHIVED, IN_CRC_REVIEW …final list at build),
  and RM-override audit (who flipped fail→pass).
- **Self-registration endpoints (trade-directory, public + throttled):**
  disclaimer text fetch + acceptance record (immutable
  `disclaimer_acceptance` table); registration (creates person + applicant
  organization + membership, dedup by business registration number, issues
  the enrollment link with portal linkBase). Corporate-email check calls
  the funder policy.
- **Documents:** portal uploads through document-management's existing
  upload API (onboarding classes reject image-only files; identity
  documents (passports) go through the eKYC/vision path per the KYC-format
  ruling). Required-set per product: **static map in code for v1**
  (domain logic, not funder preference) — configurable later if a funder
  needs it.
- **eKYC module:** provider interface + MOCK implementation (dev), vendor
  SDK slot for production. Passport name extract via the existing Claude
  vision path; deterministic-first name match + Claude fuzzy judge; CO
  review queue on mismatch (risk-operation, gated risk_org_kyc_resolve or
  a new key at build time).
- **Disclaimer content:** stored as a `legal_document_template` in
  product-configurator (funder-editable, versioned) — the acceptance
  record stores the version it rendered.
- **Kafka flows (outbox everywhere):** APPLICATION_SUBMITTED (risk-agent
  already consumes APPLICATION_SUBMITTED_FOR_REVIEW — reconcile topics at
  build), DOCUMENT_EXTRACTED → financial_credit_report (existing),
  Filter-1 scoring trigger, SLA_TIMER_START for the reminder/close windows
  (5-working-day reminder + 5 more → close, per §1 exception; 10-day RM
  engagement window), SEND_EMAIL acknowledgments.
- **E2E guard:** full journey through nginx from the 3003 origin —
  disclaimer acceptance record, corporate-email deny, registration +
  enrollment + passkey login, wizard saves, document upload (real MinIO),
  bank-country mismatch deny + pass, mock eKYC match + mismatch queue,
  submit → Filter-1 score → CRM/CRC queue assertions, SLA timers, tenant
  isolation, throttle behavior.

## Open questions for Tony

1. **Pass-1 scope confirm** — onboarding funnel end-to-end (through
   Filter-1 scoring + RM/CRC queue activation); Global Dashboard + product
   workspaces + disputes = later passes. The sequencing then is: portal
   pass 1 → Provisional Offer workspace (design agreed) → portal pass 2
   (offer acceptance + registration fee + e-signature ceremony).
2. **Portal authorization = org membership** (no funder permission keys
   for clients; signatory designation from eResolution) — confirm.
3. **Application record** = adopt-and-extend risk-operation's existing
   `application` table — confirm.
4. **Required KYC docs per product** = static in code v1 — confirm.
5. **Disclaimer as a versioned legal template** in product-configurator,
   jurisdiction wording per funder — confirm (and the jurisdiction for the
   dev seed disclaimer text: Malaysia?).
6. **Applicant funder binding** — in the shared dev DB an application must
   carry the funder it applies to. Single-funder dev: bind new applicants
   to org 2 (the dev funder) at registration; production is per-deployment
   anyway. Confirm.
