-- Provisional Offer workspace (CRC pass 2, 2026-07-24) — per the agreed
-- design docs/design/provisional-offer-design.md. Apply manually:
--   docker compose exec -T postgres psql -U postgres -d "risk-operation" \
--     -f - < apps/risk-operation/migrations/2026-07-24-provisional-offers.sql

-- Local mirror of PUBLISHED master rate cards (first RATE_CARD_PUBLISHED
-- consumer; house rule: cross-service data flows via Kafka, never sync
-- reads). One row per funder+product, replaced on each publish.
CREATE TABLE IF NOT EXISTS rate_card_mirror (
  id SERIAL PRIMARY KEY,
  funder_organization_id integer NOT NULL,
  product_code varchar NOT NULL,
  rate_card_id integer,
  version integer,
  params jsonb NOT NULL,
  updated_at timestamp NOT NULL DEFAULT LOCALTIMESTAMP,
  CONSTRAINT uq_rate_card_mirror UNIQUE (funder_organization_id, product_code)
);

-- Offer lifecycle: DRAFT -> PENDING_CHECK -> CHECKED -> APPROVED -> SENT ->
-- ACCEPTED | DECLINED | LAPSED (+ returns to DRAFT, CLOSED_ARCHIVED).
-- Maker != checker != approver enforced in-service (risk-governance pattern).
CREATE TABLE IF NOT EXISTS provisional_offer (
  id SERIAL PRIMARY KEY,
  funder_organization_id integer NOT NULL,
  application_id integer NOT NULL REFERENCES application(id),
  organization_id integer NOT NULL,
  company_name varchar,
  product_code varchar NOT NULL,
  scenario varchar NOT NULL,
  rate_card_snapshot jsonb,
  inputs jsonb NOT NULL DEFAULT '{}',
  overrides jsonb,          -- {field: {default, value}} — CRC override audit
  outputs jsonb,            -- simulator result at last save/submit
  status varchar NOT NULL DEFAULT 'DRAFT',
  maker_person_id integer NOT NULL,
  checker_person_id integer,
  approver_person_id integer,
  submitted_at timestamp,
  checked_at timestamp,
  approved_at timestamp,
  sent_at timestamp,
  resolved_at timestamp,
  resolution_note varchar(300),
  created_at timestamp NOT NULL DEFAULT LOCALTIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT LOCALTIMESTAMP
);
-- One live offer per application (superseded/declined offers stay as rows)
CREATE UNIQUE INDEX IF NOT EXISTS uq_offer_live_per_application
  ON provisional_offer (application_id)
  WHERE status IN ('DRAFT','PENDING_CHECK','CHECKED','APPROVED','SENT');
CREATE INDEX IF NOT EXISTS ix_offer_funder_status
  ON provisional_offer (funder_organization_id, status);
