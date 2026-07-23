# Funder Administration Portal — Annotated Sitemap Inventory (Phase 2)

**Status: APPROVED by Tony 2026-07-24 (all four judgment calls accepted as
proposed). Dictionary migration `1784800000000-FunderAdminPortalPermissions.ts`
applied to dev — all 19 keys live; e2e-rbac green (46 checks).**

Source: SQF Blueprint_HLD.docx (Funder Administration Portal domain) + agreed
review remedies (SLA engine config, executive approval matrix, credit-limit
ranges, bank-country policy). Notation per CLAUDE.md: `[gate:]` on every nav
node, `[action:]` only where the segregation-of-duties litmus passes,
`[inherit:]` for ordinary edits covered by the screen's key. Reused keys are
marked **(reused)**; everything else is a NEW dictionary key.

The domain nav node renders if the caller holds ANY child gate key (manifest
logic, not a key of its own).

```
Funder Administration Portal (domain)
│
├─ Security & Access Control
│   ├─ Governance Command Center (dashboard)   [gate: admin_audit_view]            (reused)
│   │    ├─ Security tickers / failed-auth heatmap / pending
│   │    │  compliance action items             [inherit: admin_audit_view]
│   │    │  Queue rule: org-scoped via JWT orgId; pending items =
│   │    │  expired director KYC + stale API credential hooks
│   │    └─ Document Audit Trails view          [gate: admin_audit_view]           (reused)
│   ├─ Dynamic Role Builder Workspace           [gate: admin_roles_manage]         (reused)
│   │    └─ create/rename/delete role, edit permission set
│   │                                           [inherit: admin_roles_manage]
│   ├─ User Directory & Provisioning            [gate: admin_users_view]           (reused)
│   │    ├─ btn Create user (+ first enrollment link issued as part
│   │    │  of creation)                        [action: admin_users_create]       NEW
│   │    ├─ btn Assign / remove roles           [action: admin_users_assign_roles] (reused)
│   │    ├─ btn Re-issue enrollment link        [action: admin_enrollment_tokens_issue] (reused)
│   │    └─ btn Force-terminate sessions        [action: admin_sessions_terminate] (reused)
│   └─ Live Security Audit & Session Ledger     [gate: admin_audit_view]           (reused)
│        ├─ btn Force Terminate Session         [action: admin_sessions_terminate] (reused)
│        └─ btn Regulatory Compliance Export    [action: admin_audit_export]       NEW*
│
├─ Product Configuration
│   ├─ Product Registry & Polymorphic Mgmt      [gate: config_products_view]       NEW
│   │    ├─ Standard Product Matrix (create/edit/toggle is_active)
│   │    │                                      [action: config_products_manage]   NEW
│   │    ├─ Custom Bespoke Plan Workbench (client-restricted products;
│   │    │  also exercised by CRA from the Provisional Offer flow)
│   │    │                                      [action: config_products_bespoke_create] NEW
│   │    └─ Dynamic Calculation Variable Injector
│   │                                           [inherit: config_products_manage /
│   │                                            config_products_bespoke_create]
│   ├─ Master Rate Card Templates & Versioning  [gate: config_products_view]
│   │    ├─ Draft/edit rate card versions       [action: config_rate_cards_manage] NEW
│   │    └─ btn Publish/activate version        [action: config_rate_cards_publish] NEW*
│   ├─ Onboarding Snapshotted Assignment Engine [gate: config_products_view]
│   │    ├─ Transition trigger monitor (client_product_assignments)
│   │    │                                      [inherit: config_products_view]
│   │    ├─ Legal Document Template Binder (upload templates, map
│   │    │  document codes to products)         [action: config_legal_templates_manage] NEW
│   │    └─ Handlebars Variable Injection Previewer
│   │                                           [inherit: config_legal_templates_manage]
│   └─ Risk Profile by Product
│        ├─ View profiles & assignments         [gate: risk_profiles_view]         (reused)
│        ├─ Assign weights to default Risk Filter 1
│        │                                      [action: risk_profiles_edit]       (reused)
│        ├─ btn Approve default-profile change (Risk Operations
│        │  Manager; writes to risk audit log)  [action: risk_profiles_approve]    NEW
│        └─ Assign Filter-2 profile to product  [action: config_risk_filters_assign] NEW
│
├─ Billing & Fee Execution Engine               [gate: config_billing_view]        NEW
│   ├─ Interest & Accrual Matrix (base rate indices, penalty rules)
│   │                                           [action: config_billing_manage]    NEW
│   ├─ Fee Schedules & Realization Controls     [inherit: config_billing_manage]
│   └─ Day-Count Convention Presets             [inherit: config_billing_manage]
│
├─ Global Clearing Calendar Engine              [gate: config_calendar_view]       NEW
│   ├─ Holiday registry upload/toggle           [action: config_calendar_manage]   NEW
│   ├─ Settlement roll-over rule configurator   [inherit: config_calendar_manage]
│   └─ Cut-off & exception days                 [inherit: config_calendar_manage]
│
└─ Governance Policies (NEW node — from agreed review remedies)
    [gate: config_policies_view]                                                   NEW
    ├─ SLA Template Configuration (all SLA timers: applicant reminders,
    │  offer windows, CM approval, enrollment expiry…)
    │                                           [action: config_sla_manage]        NEW
    ├─ Executive Approval Matrix (quorum, amount thresholds,
    │  sequential/parallel)                     [action: config_approval_matrix_manage] NEW
    ├─ Credit Limit Assignment Ranges (by product/risk score — read
    │  by CRC limit assignment)                 [action: config_credit_ranges_manage] NEW
    └─ Operational policies (bank-country match toggle + override
       rules, corporate-email blocklist)        [action: config_policies_manage]   NEW
```

## New dictionary keys (17, of which 2 flagged optional*)

| Key | Category (Role Builder accordion) | Description |
|---|---|---|
| `admin_users_create` | Configuration & Administration | Create user accounts and issue their first passkey enrollment link |
| `admin_audit_export`* | Configuration & Administration | Generate regulatory audit exports (encrypted CSV/PDF) for external auditors |
| `config_products_view` | Product Configuration | View the product registry, rate cards and assignment engine |
| `config_products_manage` | Product Configuration | Create, edit and activate/deactivate standard products |
| `config_products_bespoke_create` | Product Configuration | Create client-restricted bespoke product configurations |
| `config_rate_cards_manage` | Product Configuration | Draft and edit master rate card versions |
| `config_rate_cards_publish`* | Product Configuration | Publish/activate a master rate card version |
| `config_legal_templates_manage` | Product Configuration | Upload legal document templates and bind them to products |
| `config_risk_filters_assign` | Product Configuration | Assign a second-filter risk profile to a product |
| `risk_profiles_approve` | Credit Risk | Approve changes to the default risk profile (Risk Operations Manager) |
| `config_billing_view` | Billing & Calendar | View billing, fee and accrual configuration |
| `config_billing_manage` | Billing & Calendar | Manage base rate indices, penalty rules, fee schedules and day-count conventions |
| `config_calendar_view` | Billing & Calendar | View clearing calendars and settlement rules |
| `config_calendar_manage` | Billing & Calendar | Manage holiday registries, roll-over rules and cut-off days |
| `config_policies_view` | Governance Policies | View SLA templates, approval matrices and operational policies |
| `config_sla_manage` | Governance Policies | Create and edit SLA timer templates |
| `config_approval_matrix_manage` | Governance Policies | Configure executive approval matrices (quorum, thresholds) |
| `config_credit_ranges_manage` | Governance Policies | Configure credit-limit assignment ranges by product and risk score |
| `config_policies_manage` | Governance Policies | Manage operational policy toggles (bank-country match, email blocklist) |

Reused, no new mint: `admin_roles_manage`, `admin_users_view`,
`admin_users_assign_roles`, `admin_enrollment_tokens_issue`,
`admin_sessions_terminate`, `admin_audit_view`, `risk_profiles_view`,
`risk_profiles_edit`.

## Judgment calls flagged for Tony

1. **`config_rate_cards_publish` split** — publishing a rate card version
   changes pricing for all future clients; treated as a governance gate
   distinct from drafting. Collapse into `config_rate_cards_manage` if too
   granular.
2. **`admin_audit_export`** — could inherit under `admin_audit_view`; minted
   separately because handing audit data to external parties is a data-egress
   act a regulator would name. Collapse if preferred.
3. **Maker-checker on risk profiles** relies on role-assignment discipline
   (the same person could hold `risk_profiles_edit` AND `risk_profiles_approve`);
   same-person-cannot-approve-own-change enforcement is code-side, to be built
   with the approval flow.
4. **Bespoke product creation via CRA** (Provisional Offer flow) means
   `config_products_bespoke_create` will also appear in the CRC domain
   annotation later — same key, two surfaces. Deliberate, not a duplicate.

## Sanity-check role → key sets (illustrative only, roles are runtime-created)

- **Super Admin** — immutable role, holds everything implicitly.
- **Business Analyst** — all `_view` gates + `config_billing_manage`,
  `config_calendar_manage`.
- **Executive** — `config_products_view`, `config_billing_view`,
  `config_policies_view` only.
- **Risk Operations Manager** — `risk_profiles_view`, `risk_profiles_approve`,
  `config_risk_filters_assign`, `config_credit_ranges_manage`.
- **Product Manager (future)** — `config_products_*`, `config_rate_cards_*`,
  `config_legal_templates_manage`.
- **CRA** — `config_products_bespoke_create` (granted via a CRC-domain role).
