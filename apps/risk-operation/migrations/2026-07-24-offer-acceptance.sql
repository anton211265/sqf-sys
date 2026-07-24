-- Customer Portal pass 2 (2026-07-24): passkey e-signature acceptance
-- records (append-only — the blueprint's acceptance evidence: doc SHA-256,
-- timestamp, IP, credential ID) + registration-fee tracking on the offer.
-- Apply: docker compose exec -T postgres psql -U postgres -d "risk-operation" \
--   -f - < apps/risk-operation/migrations/2026-07-24-offer-acceptance.sql
CREATE TABLE IF NOT EXISTS offer_acceptance (
  id SERIAL PRIMARY KEY,
  offer_id integer NOT NULL REFERENCES provisional_offer(id),
  application_id integer NOT NULL,
  organization_id integer NOT NULL,
  person_id integer NOT NULL,
  credential_id varchar NOT NULL,
  terms_sha256 varchar NOT NULL,
  decision varchar NOT NULL, -- ACCEPTED | DECLINED
  decline_reason varchar(300),
  ip_address varchar,
  user_agent varchar,
  created_at timestamp NOT NULL DEFAULT LOCALTIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_offer_acceptance_offer ON offer_acceptance (offer_id);
ALTER TABLE provisional_offer ADD COLUMN IF NOT EXISTS registration_fee_confirmed_at timestamp;
ALTER TABLE provisional_offer ADD COLUMN IF NOT EXISTS registration_fee_confirmed_by integer;
