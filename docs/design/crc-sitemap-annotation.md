# Credit Risk & Compliance (CRC) — Phase-2 Sitemap Annotation

Status: **APPROVED by Tony 2026-07-24; pass 1 BUILT same day** (keys migrated,
backend + e2e-crc.mjs 40 checks green, screens live in web-next)
Sources: SQF Blueprint_HLD §1 (Provisional Offer + Product Fulfillment Pre-Approval
workflows), §2/§3 CRC sitemap; `SQF ARCHITECTURE/Risk Model Template- Specs &
Workflow.md` (Filter-2 authoring spec); Tony's four Filter-2 rulings (2026-07-24).

## Rulings this annotation bakes in (2026-07-24)

1. **Score orientation coexists per domain, always labeled.** Filter-2 models are
   *risk-points* (high score = HIGH risk; overrides pin 100 = High). Filter-1 /
   default profile keeps its existing orientation (high score = LOW risk). Every
   screen that shows either score renders the band badge with a text label; the two
   raw numbers are never combined arithmetically or shown unlabeled side by side.
2. **Filter-2 is a qualitative overlay, not a Filter-1 replacement.** Filter-1
   (default risk profile) produces the go/no-go for CRA/CRC Manager. Filter-2 is
   the CO's qualitative assessment: the CO picks an existing **published** model
   from a pulldown or authors a new one.
3. **Roll-up math v1:** leaf normalized = raw ÷ scoring-method range-max, weighted
   bottom-up (sub-factor → category → factor), total on 0–100. The formula lives in
   one engine function so alternates can be swapped in later — Filter-2 is meant to
   be flexible; we test and adjust.
4. **Maker-checker publish** per blueprint: CO maker → second CO checker → CM
   (Compliance Manager) approves before PUBLISHED. Straight high-risk overrides are
   available to both model shapes. "Template library" = the two structural
   templates (Simple Weighted / Multi-Factor) + duplicate-existing; no seeded
   content (narrow-initialization ruling).

## Actors (runtime roles — keys only, never role checks)

- **CRA** (Credit Risk Analyst) — new-application queue, provisional offers, OL drafting.
- **CO** (Compliance Officer) — KYC/agency reports, Filter-2 authoring + assessment, clear/reject recommendation.
- **CM** (Compliance Manager) — Filter-2 publish approval, recommendation approval, suspension lifts.
- **CRC Manager** — provisional-offer + OL approvals, Filter-1 governance (risk_profiles_approve already live).

## Annotated sitemap

```
Credit Risk & Compliance (domain)
├─ CRC Dashboard                                  [gate: risk_applications_view]
│   ├─ New application bucket (team queue)        [inherit: risk_applications_view]
│   │     queue rule: applications status IN (PENDING_RISK_FILTER_2, …post-Filter-1
│   │     pass states), funder scope, ORDER BY updatedAt ASC, self-assign on pickup
│   │     → btn Pick up / assign to me            [action: risk_applications_assess]
│   ├─ Client risk & compliance monitors/alerts   [gate: compliance_checks_view]
│   │     (bulk of monitoring = Compliance & Policy Agent — post-SQF; screen shows
│   │      flags/alerts feed only)
│   └─ Documents (current + archive, per client)  [inherit: documents_view / documents_search]
│         btn Request additional documents         → DEFERRED (Customer Portal phase)
│
├─ Credit Reports                                 [gate: risk_kyc_reports_view]
│   ├─ View agency/credit reports                 [inherit: risk_kyc_reports_view]
│   ├─ btn Request new report (3rd-party agency)  [action: risk_kyc_reports_request]  ← DEFERRED to mock-agency pass
│   └─ Data-mismatch flags (red traffic light)    [inherit: risk_kyc_reports_view]
│
├─ Risk Assessment & Approvals
│   ├─ Filter 1 — View/Modify Default Risk profile  [gate: risk_profiles_view]
│   │     (BUILT — risk-governance maker-checker + RiskProfiles screen; CRC nav
│   │      links to the same screen, no new keys)
│   │     btn Propose weight change               [inherit: risk_profiles_edit]
│   │     btn Approve/Reject change               [inherit: risk_profiles_approve]
│   ├─ Filter 2 — Risk Model Library              [gate: risk_models_view]
│   │     list: DRAFT / PENDING_CHECK / CHECKED / PUBLISHED / ARCHIVED, weight
│   │     pie-chart preview, duplicate-existing
│   │   ├─ Model Builder (create/edit)            [gate: risk_models_edit]
│   │   │     Simple Weighted + Multi-Factor shapes, 8 scoring methods with the
│   │   │     spec's validations, straight high-risk overrides, threshold slider,
│   │   │     survey preview tab — all [inherit: risk_models_edit]
│   │   │     btn Submit for check                [inherit: risk_models_edit]
│   │   ├─ btn Verify (checker — not the maker)   [action: risk_models_check]
│   │   └─ btn Approve & Publish (CM)             [action: risk_models_publish]
│   └─ Filter 2 — Run Assessment (survey)         [gate: risk_assessments_view]
│         pulldown of PUBLISHED models → survey (tabs/accordions per model shape,
│         progress bar, live score + labeled classification)
│         btn Conduct/submit assessment           [action: risk_assessments_conduct]
│         assessment history per client (append-only) [inherit: risk_assessments_view]
│
├─ Credit Limit                                   ← DEFERRED (second CRC pass)
│   ├─ Assign limit (product type + risk score +
│   │   credit score vs configured ranges)        [action: risk_credit_limits_assign]   (key minted then)
│   └─ Limit approval                             [action: risk_credit_limits_approve]  (key minted then)
│
└─ Provisional Offer workspace                    ← DEFERRED (second CRC pass)
      cashflow simulator (cashflow simulator.xlsx), CRA maker → CRA checker →
      CRC Manager approve, applicant SLA timers — needs its own design session
```

## New permission keys (this pass → dictionary 64 → 68, category "Credit Risk")

| Key | Verb rationale (litmus test) |
|---|---|
| `risk_models_check` | Checker half of maker-checker — a CO who authors models must not be able to self-verify. |
| `risk_models_publish` | CM-only publish gate — distinct from both edit and check; the blueprint names it explicitly. |
| `risk_assessments_view` | Read side of assessments; RMs/executives may later view results without conducting. |
| `risk_assessments_conduct` | Running a client through a filter is a named workflow action (CO), separate from authoring models and from application assessment (`risk_applications_assess`, CRA). |

Reused, no near-duplicates minted: `risk_models_view`, `risk_models_edit`,
`risk_applications_view`, `risk_applications_assess`, `risk_kyc_reports_view`,
`risk_profiles_view/edit/approve`, `compliance_checks_view`, `documents_view`,
`documents_search`. Deferred keys (minted with their passes, listed to reserve
names): `risk_kyc_reports_request`, `risk_credit_limits_assign`,
`risk_credit_limits_approve`, plus the recommendation chain
(`risk_clients_recommend`, `risk_recommendations_approve`) which belongs to the
Product Fulfillment flow (needs Customer Portal + registration fee + Finance).

## Backend plan (build pass 1)

**Adopt-and-govern the legacy risk-model tables, not parallel new ones.** The
2024-era `risk_model` / `risk_factor` / `risk_evaluation_parameter` /
`risk_high_classification_factor` tables already implement the template spec's
shape (tabs, categories via parentId/isSetAsCategory, sub-factors, thresholds,
country jsonb, DRAFT/PUBLISHED/ARCHIVED) because the same spec drove the original
build. They hold 2 demo rows, no tenancy, no guards, and 4 of 8 scoring methods.
This is the per-domain swap moment for this module. Migration (manual DDL +
TypeORM migration):

- `risk_model`: add `funderOrganizationId` int (tenant scope), `modelShape`
  (SIMPLE_WEIGHTED | MULTI_FACTOR), maker-checker columns
  (`createdByPersonId`, `checkedByPersonId`, `publishedByPersonId`,
  `submittedAt/checkedAt/publishedAt`), status enum extended
  DRAFT → PENDING_CHECK → CHECKED → PUBLISHED / ARCHIVED (add-only enum values),
  uniqueness re-scoped to (funder, name).
- `RiskFactorScoreMethodEnum`: add CONDITIONAL_NUMERIC, BOOLEAN, DATE_RANGE,
  DATE_BASED (add-only). Method config (labels/points, sub-scoring nests,
  conditions, dropdown options, dates) in a `scoringConfig` jsonb on
  factor/sub-factor rows — validations enforced service-side per the spec's rules
  (label points cover range exactly, sub-scoring ≤ parent label points, weights
  total 100 per level, IF-advance-style hard checks).
- Country-based scoring: CSV upload endpoint parsing country→score rows into the
  existing countryList jsonb (per Tony's own note in the spec).
- New `risk_assessment` (+ `risk_assessment_answer`) tables: subject =
  `organizationId` (client), `riskModelId` + a **snapshot** of the model structure
  (jsonb) so published-model edits never mutate past assessments, answers, computed
  breakdown, total, classification, overrides tripped, `conductedByPersonId`,
  append-only.
- Same-transaction audit rows into the existing `risk_audit_log` for model
  lifecycle transitions and assessments (reuse risk-governance's table + pattern).
- Guards: `RemotePermissionGuard` + `@RequirePermission` on every endpoint
  (risk-operation is already an adopter). Maker≠checker and checker≠publisher
  enforced code-side (same-person checks, as in risk-governance).
- Scoring engine: one pure function per Ruling 3 (normalized ÷ range-max,
  weighted roll-up, override short-circuit to 100/High) with the formula isolated
  for later swaps. Classification = threshold containment (risk-points
  orientation, labeled).
- E2E: extend a new `apps/risk-operation/scripts/e2e-crc.mjs` — model lifecycle
  incl. maker-checker negatives (self-check 403, publish before check 400),
  validation rules per scoring method, assessment run with known answers
  asserting the worked-example total, override trip, snapshot immutability,
  tenant isolation, audit rows. Rerun `verify-default-profile-scoring.ts`
  untouched-green (Filter-1 engine not modified).

**Product-configurator follow-up (small, this pass):** the Filter-2 → product
assignment dropdown currently lists `is_default=0` risk_profiles. Once models
exist, the assignment source becomes **published risk models** (the stored
`riskProfileCode` bare reference simply carries the model's code — no migration
needed). Per Ruling 2 the product assignment is the *default suggestion*; the CO
still picks from the pulldown at assessment time.

## Screens (build pass 1, web-next)

New nav section "Credit Risk & Compliance": CRC Dashboard (queue shell with
phase-boundary placeholders for portal-driven intake), Risk Model Library +
Builder (the template spec's UI translated to shadcn/Tailwind: tabs, accordions,
inline-editable tables, expandable scoring-method rows, Recharts pie charts,
threshold slider, survey preview), Run Assessment (survey + history). Filter-1
governance stays the existing RiskProfiles screen, linked from both nav sections.

## Deferred (later CRC passes — explicitly out of pass 1)

Provisional Offer workspace + cashflow simulator (own design session with
cashflow simulator.xlsx); credit-limit assign/approve (consumes configurator
credit_limit_range + approval matrix); 3rd-party agency integration + local mock
agency directory; request-additional-documents (Customer Portal);
clear/reject recommendation chain + executive approval (Product Fulfillment);
compliance monitoring automation (Compliance & Policy Agent, post-SQF);
SLA timers for CRA pickup/CM approval (wired when those queues carry real flow).
