# CRM (Customer Relationship Management) — Annotated Sitemap Inventory (Phase 2)

**Status: APPROVED by Tony 2026-07-24 (all five design decisions accepted
as proposed).**

Source: SQF Blueprint_HLD.docx (CRM domain, Section 2 + 3) + Section-1
processes 3 ("walk-in" onboarding, CRM-owned steps) and 4 (New Application
initiated by RM). Notation per CLAUDE.md: `[gate:]` on nav nodes,
`[action:]` only where the segregation-of-duties litmus passes,
`[inherit:]` for ordinary edits under the screen's key. Reused keys marked
**(reused)**; everything else is a NEW dictionary key (category
"Customer Relationship Management" unless noted).

## Funnel lifecycle (drives the queue rules)

```
LEAD (unqualified) → PROSPECT (qualified) → APPLICANT (onboarding) →
CLIENT non-active (registration fee paid) → CLIENT active (facility signed)
```

CRM owns Lead→Prospect→promotion; the Applicant stage is executed by the
Customer Portal + CRC domains (not yet built) — see "Phase boundary" below.

## Annotated sitemap

```
CRM (domain)
│
├─ Supervisor Dashboard                     [gate: crm_supervisor_view]      NEW
│   ├─ New applicants status (web intake)   [inherit: crm_supervisor_view]
│   │    Queue rule: applicants org-scoped, status NEW, unassigned —
│   │    ACTIVATES with the Customer Portal intake (phase boundary)
│   ├─ RM performance & conversion rate     [inherit: crm_supervisor_view]
│   │    (assignments/leads/prospects/clients per RM, conversion =
│   │    prospects÷leads and won-deals÷prospects, computed from CRM data)
│   ├─ Team pipeline board (all RMs)        [inherit: crm_supervisor_view]
│   └─ btn Assign lead/applicant/client to RM
│                                           [action: crm_assignees_manage]  (reused)
│        Queue rule: org-scoped; assignment writes the assignee mapping
│        (existing client_assignee concept generalised to the funnel)
│
├─ My Pipeline (RM)                         [gate: crm_pipeline_view]        NEW
│   ├─ Leads management (create/edit, qualify → PROSPECT, close/park)
│   │                                       [action: crm_leads_manage]       NEW
│   ├─ Kanban board (drag deal between stages)
│   │                                       [inherit: crm_deals_manage]
│   ├─ Deal detail (value, product, expected close, notes, create/update)
│   │                                       [action: crm_deals_manage]       NEW
│   └─ btn Promote prospect → Applicant     [action: crm_prospects_promote]  NEW
│        Starts the RM-initiated onboarding (Section-1 process 4): creates
│        the applicant shell, emails the onboarding link (SEND_EMAIL via
│        outbox; link target stubbed until the Customer Portal exists) and
│        starts the 5wd SLA timer (SLA_TIMER_START via outbox — the SLA
│        engine consumes it today)
│        Queue rule: own prospects only (ownerRmPersonId = me);
│        supervisors act on any via crm_supervisor_view
│
├─ My Applicants (RM)                       [gate: onboarding_applicants_view] (reused)
│    Queue rule: assignee = me, status IN (NEW, FAIL_ENGAGEMENT, PENDING_*)
│    — list ACTIVATES with Customer Portal intake; fail-status engagement
│    (10wd auto-close SLA) rides the same SLA engine
│    └─ Manual application form             [action: onboarding_applications_manage] (reused)
│
├─ Client Management — Assigned             [gate: onboarding_clients_view]  (reused)
│    Queue rule: clients whose assignee mapping = me
│    └─ Client performance dashboard        [inherit: onboarding_clients_view]
│         v1 shows directory facts (subscriptions, contracts, invoices from
│         trade-directory); DPD/DBT/dilution/exposure metrics land with the
│         Finance Hub & Operations domains (flagged below)
│
└─ Site Visit Reports (Assessment)          [action: onboarding_site_visits_manage] (reused)
     Gate for the list view: crm_pipeline_view (own) / crm_supervisor_view (all)
```

## New dictionary keys (5)

| Key | Description |
|---|---|
| `crm_supervisor_view` | View the supervisor dashboard: team pipeline, RM performance, unassigned queues |
| `crm_pipeline_view` | View own leads, prospects and deal pipeline |
| `crm_leads_manage` | Create, edit, qualify and close leads and prospects |
| `crm_deals_manage` | Create and update deals and move them across pipeline stages |
| `crm_prospects_promote` | Promote a prospect to applicant and initiate onboarding |

Reused, no new mint: `crm_assignees_view`, `crm_assignees_manage`,
`onboarding_applicants_view`, `onboarding_applications_manage`,
`onboarding_clients_view`, `onboarding_site_visits_manage`.

## Backend plan (customer-relationship-management service)

The nearly-empty CRM service gets its real domain: `lead`, `deal`,
`deal_stage_history` (append-only stage moves for conversion analytics),
`site_visit_report` tables — all with `funderOrganizationId` scoping and
bare `organizationId`/`personId` references (house rule). Standard outbox +
processed_event; RemotePermissionGuard from libs/common (third adopter).
Promotion emits `SEND_EMAIL` + `SLA_TIMER_START` through the outbox —
first real business-flow consumer of the SLA engine.

## Design decisions needing Tony's sign-off

1. **Kanban stages** (blueprint doesn't enumerate them). Proposed:
   `QUALIFIED → PROPOSAL → NEGOTIATION → WON | LOST`. Leads sit before the
   board (LEAD/PROSPECT are lead statuses, not deal stages).
2. **Phase boundary:** applicant intake (walk-in web form, default-risk
   scoring trigger, real onboarding links) belongs to the Customer Portal +
   CRC domains. CRM v1 builds the full lead→prospect→deal pipeline,
   assignment, dashboards and site visits now; "My Applicants" and the
   supervisor's "new applicants (web)" queue ship as empty-state screens
   that activate when intake exists. Promotion already does its CRM-side
   work (applicant shell + SLA timer + email with stub link).
3. **Assignment key reuse:** supervisor assignment reuses
   `crm_assignees_manage` rather than minting a near-duplicate
   `crm_assignments_manage` — the legacy client-assignee concept is the
   same intent generalised to the funnel.
4. **Client performance metrics** (DPD, DBT, dilution, exposure) need
   Finance/Operations data that doesn't exist yet — v1 renders what
   trade-directory knows (subscriptions, contracts, invoice aging from
   invoice dates) and leaves labelled placeholders for the rest.
5. **Deal attachments** ("contract attachments" in the blueprint) defer to
   a document-management integration pass; v1 deals carry structured
   fields + notes.
