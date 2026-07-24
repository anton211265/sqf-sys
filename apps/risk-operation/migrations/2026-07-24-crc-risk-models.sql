-- CRC pass 1 (2026-07-24): adopt-and-govern the legacy Filter-2 risk-model
-- tables per the signed-off annotation (docs/design/crc-sitemap-annotation.md).
-- Adds funder tenancy, model shape, maker-checker lifecycle columns, the four
-- missing scoring methods, per-node scoringConfig, and the append-only
-- assessment tables. Wipes the two tenancy-less 2024 demo rows (dev data).
-- Apply manually:
--   docker compose exec -T postgres psql -U postgres -d "risk-operation" \
--     -f - < apps/risk-operation/migrations/2026-07-24-crc-risk-models.sql

-- Lifecycle: DRAFT -> PENDING_CHECK -> CHECKED -> PUBLISHED / ARCHIVED
ALTER TYPE "RiskModelStatusEnum" ADD VALUE IF NOT EXISTS 'PENDING_CHECK';
ALTER TYPE "RiskModelStatusEnum" ADD VALUE IF NOT EXISTS 'CHECKED';

-- The four scoring methods the legacy build never implemented
ALTER TYPE "RiskFactorScoreMethodEnum" ADD VALUE IF NOT EXISTS 'CONDITIONAL_NUMERIC';
ALTER TYPE "RiskFactorScoreMethodEnum" ADD VALUE IF NOT EXISTS 'BOOLEAN';
ALTER TYPE "RiskFactorScoreMethodEnum" ADD VALUE IF NOT EXISTS 'DATE_RANGE';
ALTER TYPE "RiskFactorScoreMethodEnum" ADD VALUE IF NOT EXISTS 'DATE_BASED';

ALTER TABLE risk_model ADD COLUMN IF NOT EXISTS "funderOrganizationId" integer;
ALTER TABLE risk_model ADD COLUMN IF NOT EXISTS "modelShape" varchar NOT NULL DEFAULT 'MULTI_FACTOR';
ALTER TABLE risk_model ADD COLUMN IF NOT EXISTS "createdByPersonId" integer;
ALTER TABLE risk_model ADD COLUMN IF NOT EXISTS "checkedByPersonId" integer;
ALTER TABLE risk_model ADD COLUMN IF NOT EXISTS "publishedByPersonId" integer;
ALTER TABLE risk_model ADD COLUMN IF NOT EXISTS "submittedAt" timestamp;
ALTER TABLE risk_model ADD COLUMN IF NOT EXISTS "checkedAt" timestamp;
ALTER TABLE risk_model ADD COLUMN IF NOT EXISTS "publishedAt" timestamp;

-- Per-node scoring-method configuration (labels/points/sub-scoring, dropdown
-- options, conditions, dates, boolean scores, country rows) — one jsonb for
-- all 8 methods; the legacy countryList jsonb stays untouched/unused by v2.
ALTER TABLE risk_factor ADD COLUMN IF NOT EXISTS "scoringConfig" jsonb;

-- Wipe the 2024 demo rows: they predate tenancy and cannot be attributed to a
-- funder. risk_application_scoring is SHARED with the Filter-1 chain — only
-- its riskModelId references are nulled, nothing else is touched.
UPDATE risk_application_scoring SET "riskModelId" = NULL WHERE "riskModelId" IS NOT NULL;
DELETE FROM risk_factor_scoring;
DELETE FROM risk_high_classification_scoring;
DELETE FROM risk_evaluation_parameter;
DELETE FROM risk_high_classification_factor;
DELETE FROM risk_factor;
DELETE FROM risk_model;

-- Tenancy is mandatory from here on; name uniqueness is per funder
-- (riskModelNumber stays globally unique — generated RM_xxxxxx codes).
ALTER TABLE risk_model ALTER COLUMN "funderOrganizationId" SET NOT NULL;
ALTER TABLE risk_model DROP CONSTRAINT IF EXISTS "UQ_54adefb1d77bd613701e1e682e2";
CREATE UNIQUE INDEX IF NOT EXISTS uq_risk_model_funder_name
  ON risk_model ("funderOrganizationId", "riskModelName");

-- Append-only assessment instances: subject = client organization (bare
-- trade-directory organizationId int per the house cross-service rule). The
-- model structure is SNAPSHOTTED per assessment so later edits/republishes
-- never mutate past results (same philosophy as rate-card assignments).
CREATE TABLE IF NOT EXISTS risk_assessment (
  id SERIAL PRIMARY KEY,
  funder_organization_id integer NOT NULL,
  organization_id integer NOT NULL,
  organization_name varchar,
  risk_model_id integer NOT NULL REFERENCES risk_model(id),
  risk_model_number varchar NOT NULL,
  risk_model_name varchar NOT NULL,
  model_snapshot jsonb NOT NULL,
  total_score numeric NOT NULL,
  classification varchar NOT NULL, -- LOW/MEDIUM/HIGH, risk-points orientation (high score = HIGH risk)
  override_tripped boolean NOT NULL DEFAULT false,
  override_factors jsonb,
  breakdown jsonb NOT NULL,
  conducted_by_person_id integer NOT NULL,
  created_at timestamp NOT NULL DEFAULT LOCALTIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_risk_assessment_org
  ON risk_assessment (funder_organization_id, organization_id);

CREATE TABLE IF NOT EXISTS risk_assessment_answer (
  id SERIAL PRIMARY KEY,
  risk_assessment_id integer NOT NULL REFERENCES risk_assessment(id) ON DELETE CASCADE,
  node_key varchar NOT NULL,
  node_name varchar NOT NULL,
  raw_value jsonb,
  points numeric,
  normalized numeric,
  weighted_contribution numeric
);
CREATE INDEX IF NOT EXISTS ix_risk_assessment_answer_assessment
  ON risk_assessment_answer (risk_assessment_id);
