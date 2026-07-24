# Provisional Offer Workspace + Cashflow Simulator — Design (CRC pass 2)

Status: **DESIGN AGREED 2026-07-24 — build DEFERRED until the Customer
Portal exists (Tony's ruling on Q3: "Let's build the customer portal
first"). Rulings recorded below; resume this doc when application intake
is live.**

## Tony's rulings (2026-07-24)

1. Product ↔ scenario mapping: Claude's recommendation stands
   (pending final confirm at build time) — four composable scenario
   functions: POST_FACTORING (AR + IF), PRE_FACTORING (IF, always with a
   post block), TERM_LOAN (standalone default; flat AND reducing-balance
   conventions; optional post-factoring combo = the workbook's TF+Post
   sheet), and a new SCF scenario (buyer-led, ≤100% advance less
   discount, profit = discount over buyer terms — parameters per the
   blueprint's SCF key characteristics). Product → scenario is a lookup;
   bespoke products inherit their base product's scenario.
2. Parameterize everything — CONFIRMED. Nothing hardcoded: remittance
   fee → fee_schedule, credit period/rates → rate cards, day-count →
   funder_config_settings, currency → rate card/funder.
3. Offer subject: applications will exist first — the Customer Portal is
   built BEFORE this workspace, so offers attach to real applications
   (no organization-only interim shape needed).
4. Reducing-balance option for TL — CONFIRMED (alongside the workbook's
   flat convention).
5. Rate-card defaults via Kafka mirror (first RATE_CARD_PUBLISHED
   consumer + backfill) — CONFIRMED.
6. Keys risk_offers_view/manage/check/approve/resolve — APPROVED
   (minted when this builds, dictionary → 73).
Sources: SQF Blueprint_HLD §1 "Provisional Offer" workflow;
`SQF ARCHITECTURE/cashflow simulator.xlsx` (4 sheets, decoded below);
docs/design/crc-sitemap-annotation.md (deferred-item list).

---

## 1. What the spreadsheet actually computes (decoded)

Four sheets; three simulator scenarios plus one input schedule. All math is
deterministic — inputs → monthly economics → funder profit projection →
**highest exposure** (the peak funding requirement, the credit decision
number) with the month it occurs.

### Sheet "Post Factoring" (post-shipment factoring)
Inputs: contract start/end, contract value, **unexpired contract value
(UCV)**; facility limit, factoring advance %, admin fee % per invoice,
tenure (number of monthly invoices), credit period (60d default), post
profit rate % p.a. (12% default), disbursement start month, collection
period months (default 2).
Derived monthly economics:
- invoice = UCV ÷ tenure
- advance = invoice × advance%
- adminFee = invoice × adminFee%
- profit = (advance − adminFee) × rate × creditPeriod ÷ 360   ← ACT/360
Profit projection: processing fee on application + adminFee×tenure +
profit×tenure + **RM40 × tenure** (hardcoded remittance processing fee) +
others (LOU/LOS/advisory).
Highest exposure: month = start + min(collectionPeriod, tenure) − 1;
amount = cumulative net disbursements before collections begin
(advance×m − processingFee − (adminFee+profit)×m, m = min(tenure, collection)).

### Sheet "Pre Factoring" (pre + post factoring combo)
Pre block: facility limit, advance %, credit period (lock-in) days, pre
profit rate % **flat**; monthly pre rate = rate ÷ lockIn × 30 (flat/month);
monthly pre profit RM = limit × monthly rate. Post block identical to
sheet 1. Profit projection split Pre/Post. Highest exposure: if post
disbursements within the collection period cover the pre outstanding, the
exposure is post-side net disbursement; otherwise the pre-facility limit —
with an EDATE/roundup timing formula on the lock-in.

### Sheet "Term Financing" (TL + post factoring combo)
TF block: facility limit, no. of instalments, TF profit rate % **flat per
month** (not reducing balance), TF processing fee %. Monthly principal =
limit ÷ instalments; monthly profit = limit × rate; instalment = principal
+ profit; **net initial disbursement = limit − first instalment − processing
fee** (both deducted upfront). Post block again; post disbursements are
net of the monthly TF instalment + admin fee. Highest exposure combines
both facilities.

### Sheet "Invoice Listing" (input schedule)
Projected invoice timeline feeding UCV: milestone contracts (% of
completion × month) and recurring invoices (monthly grid × 3 years), with
a reconciliation check that the schedule totals the unexpired contract
value. This is the applicant-side projection — the same artefact as the
blueprint's "6-month rolling schedule of projected invoices" in the AR
workspace, appearing here at underwriting time.

### Legacy artifacts to parameterize (not carry over)
"SAPM" branding → Funder; RM currency → rate-card/funder currency; RM40
remittance fee → `fee_schedule` entry; 60-day credit period + 12% rate →
rate-card defaults; 360-day year → funder day-count convention
(`funder_config_settings`, ACT_360/ACT_365/30_360 already built).

---

## 2. Workflow (blueprint §1, restated as a state machine)

```
CRA picks up applicant from CRC bucket (2-working-day SLA to complete stage)
DRAFT ──simulate/edit──► maker submits ──► PENDING_CHECK (2nd CRA)
  ▲                                            │ verify
  │◄──── returned/rejected (RM notified) ──────┤
  │                                            ▼
  │                                        CHECKED ──► CRC Manager
  │◄───────────── reject ──────────────────────┤
                                               ▼ approve
                                           APPROVED ──auto──► SENT (link to applicant,
                                                              5-working-day SLA)
        applicant accepts ──► ACCEPTED (→ ILO, registration fee, Product Fulfillment)
        applicant rejects ──► DECLINED (RM notified; RM may request new offer or close)
        SLA breach ─────────► LAPSED  (RM notified; RM refreshes unchanged → SENT again,
                                       or closes/archives)
```

Maker-checker-approver segregation code-side, same pattern as risk models:
maker ≠ checker; neither can be the CRC Manager approver for that offer.

## 3. Proposed architecture

- **Simulator = pure functions** in risk-operation
  (`sqf/crc/cashflow-simulator.ts`, sibling of scoring-engine.ts): one
  scenario function per product shape, each returning monthly economics,
  a full month-by-month cashflow schedule (the xlsx implies it; we
  tabulate it properly), profit projection lines, and highest exposure
  {month, amount}. Server computes and persists outputs; the frontend
  mirrors for live preview (same split as Filter-2 scoring).
- **`provisional_offer` table** (risk-operation): funder scope, subject
  (see Q3), productCode, rateCard provenance (id/version + full snapshot),
  `inputs` jsonb, `overrides` jsonb (which defaults the CRA changed —
  "was X" diffs, CRC-override audit per blueprint), `outputs` jsonb,
  invoice-schedule jsonb (milestones + recurring grid, reconciliation
  check), status machine above, maker/checker/approver person ids +
  timestamps, append-only `risk_audit_log` events per transition.
- **Rate-card defaults via Kafka mirror.** House rule: cross-service data
  flows via Kafka, never synchronous cross-service reads. risk-operation
  becomes the **first consumer of RATE_CARD_PUBLISHED** (topic emitted
  since the configurator build, no consumers yet): a small
  `rate_card_mirror` table (productCode → published params, replaced on
  each publish, processed_event idempotency). Simulator defaults come
  from the mirror; a one-off backfill script mirrors already-published
  cards. The CRA's alternative path (bespoke product via
  `products/bespoke`) already exists — a bespoke publish emits the same
  event and lands in the mirror.
- **SLA engine integration** (first SLA_BREACHED consumer): templates
  `CRA_PROVISIONAL_OFFER` (2 WORKING_DAYS, subject OFFER, started at
  DRAFT-create/pickup) and `OFFER_ACCEPTANCE` (5 WORKING_DAYS, started at
  SENT). risk-operation consumes `SLA_BREACHED`: on OFFER_ACCEPTANCE
  breach → offer LAPSED + RM notification via SEND_EMAIL outbox. Both
  timers cancelled via SLA_TIMER_CANCEL on earlier resolution.
- **Send-to-applicant is a stub in this pass** (same as CRM promotion's
  onboarding link): APPROVED auto-transitions to SENT + SEND_EMAIL outbox
  with a placeholder link; real acceptance arrives with the Customer
  Portal (acceptance = passkey re-auth e-signature ceremony per the
  blueprint gap remedies — that lands with the portal, not here).

## 4. Proposed permission keys (Credit Risk category)

| Key | Holder / rationale |
|---|---|
| `risk_offers_view` | gate for the workspace + queue |
| `risk_offers_manage` | CRA maker: create, simulate, edit, submit |
| `risk_offers_check` | second CRA verifies (≠ maker) |
| `risk_offers_approve` | CRC Manager approve/reject (≠ maker, ≠ checker) |
| `risk_offers_resolve` | RM-side actions after applicant outcome: refresh a lapsed offer (unchanged terms), close & archive |

(5 keys → dictionary 73. `risk_offers_resolve` could instead fold into a
future RM/onboarding key — flagged as question 6.)

## 5. Screens (web-next, CRC nav)

- **Offer queue** (`/crc/offers`, gate risk_offers_view): status-bucketed
  list (my drafts / awaiting check / awaiting approval / sent / needs RM
  action), SLA countdowns from the timers monitor pattern.
- **Offer workspace** (`/crc/offers/:id`): product-type-driven simulator
  form with rate-card defaults prefilled and override "was X" badges;
  invoice-schedule editor (milestones + recurring grid with
  reconciliation check against UCV); outputs panel — monthly economics,
  profit projection table, **highest exposure tile + cashflow chart**
  (Recharts, dashboard standard); lifecycle buttons per status+key;
  maker/checker/approver attribution trail.

## 6. Open questions for Tony (blocking build start)

1. **Product ↔ scenario mapping.** Post Factoring ↔ AR and/or IF?
   Pre Factoring ↔ which product code? Does **SCF** need its own scenario
   (buyer-led, up to 100% advance less discount — not in the workbook),
   and should TL keep the workbook's TF+post-factoring combo or simulate
   standalone TL with post-factoring as an optional add-on?
2. **Parameterize everything?** RM40 remittance fee, 60-day credit
   period, 12% rate, 360-day year, RM currency all become funder config /
   rate-card values with nothing hardcoded — confirm.
3. **Offer subject in this pass.** Applications don't exist until the
   Customer Portal lands. Attach offers to `organizationId` (+ optional
   CRM leadId), with a nullable `applicationId` added when intake
   arrives? Or hold the whole build until application intake exists?
4. **Flat-rate conventions.** TF profit = limit × flat monthly rate (not
   reducing balance); pre-factoring profit flat on the facility limit.
   Keep the flat commercial convention exactly as the workbook, or add a
   reducing-balance option now?
5. **Rate-card defaults via Kafka mirror** (RATE_CARD_PUBLISHED consumer
   + backfill) — confirm over frontend-supplied parameters.
6. **RM actions + keys**: is `risk_offers_resolve` (refresh/close) the
   right home for the RM's part, and are the 5 proposed keys approved?
