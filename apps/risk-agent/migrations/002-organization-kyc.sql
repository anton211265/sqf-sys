-- Manual DDL migration (POSTGRES_SYNCHRONIZE=false). Run against the
-- "risk-agent" database, e.g.:
--   docker compose exec -T postgres psql -U postgres -d "risk-agent" -f apps/risk-agent/migrations/002-organization-kyc.sql
--
-- "RiskAgentHumanOutcomeEnum" already exists from 001-init.sql — reused
-- below, not re-created.

CREATE TYPE "OrganizationKycSourceEnum" AS ENUM ('invoice_issuer', 'invoice_debtor');
CREATE TYPE "OrganizationKycOutcomeEnum" AS ENUM ('CLEAR', 'FLAGGED');
CREATE TABLE IF NOT EXISTS organization_kyc_recommendation (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  organization_name VARCHAR NOT NULL,
  business_registration_number VARCHAR NULL,
  country VARCHAR NOT NULL,
  source "OrganizationKycSourceEnum" NOT NULL,
  funder_persona_id INTEGER NOT NULL,
  outcome "OrganizationKycOutcomeEnum" NOT NULL,
  confidence NUMERIC NOT NULL,
  reasoning JSONB NOT NULL,
  escalate BOOLEAN NOT NULL DEFAULT FALSE,
  human_outcome "RiskAgentHumanOutcomeEnum" NOT NULL DEFAULT 'PENDING',
  human_actor_id INTEGER NULL,
  human_note TEXT NULL,
  resolved_at TIMESTAMP WITHOUT TIME ZONE NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_organization_kyc_recommendation_organization_id ON organization_kyc_recommendation(organization_id);
