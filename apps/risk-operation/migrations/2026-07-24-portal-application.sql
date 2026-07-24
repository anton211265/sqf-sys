-- Customer Portal pass 1 (2026-07-24): adopt-and-extend the existing
-- application table for web-intake applications (approved annotation Q3 —
-- it already anchors the Filter-1 scoring chain). Add-only enum values.
-- Apply manually:
--   docker compose exec -T postgres psql -U postgres -d "risk-operation" \
--     -f - < apps/risk-operation/migrations/2026-07-24-portal-application.sql

ALTER TYPE "ApplicationStatusEnum" ADD VALUE IF NOT EXISTS 'SUBMITTED';
ALTER TYPE "ApplicationStatusEnum" ADD VALUE IF NOT EXISTS 'SCORED_PASS';
ALTER TYPE "ApplicationStatusEnum" ADD VALUE IF NOT EXISTS 'SCORED_FAIL';
ALTER TYPE "ApplicationStatusEnum" ADD VALUE IF NOT EXISTS 'IN_CRC_REVIEW';
ALTER TYPE "ApplicationStatusEnum" ADD VALUE IF NOT EXISTS 'CLOSED_ARCHIVED';

ALTER TABLE application ADD COLUMN IF NOT EXISTS "funderOrganizationId" integer;
ALTER TABLE application ADD COLUMN IF NOT EXISTS "productCode" varchar;
-- Wizard state: companyProfile / applicationForm / documents / bankAccount /
-- directors / eResolution — shape owned by the portal-application service.
ALTER TABLE application ADD COLUMN IF NOT EXISTS "applicationPayload" jsonb;
-- Mock-eKYC + policy flags surfaced to the CO (director name mismatches,
-- FLAG_ONLY bank-country / corporate-email hits).
ALTER TABLE application ADD COLUMN IF NOT EXISTS "complianceFlags" jsonb;
ALTER TABLE application ADD COLUMN IF NOT EXISTS "submittedAt" timestamp;
ALTER TABLE application ADD COLUMN IF NOT EXISTS "scoredAt" timestamp;
ALTER TABLE application ADD COLUMN IF NOT EXISTS "statusOverriddenByPersonId" integer;
ALTER TABLE application ADD COLUMN IF NOT EXISTS "statusOverriddenAt" timestamp;
ALTER TABLE application ADD COLUMN IF NOT EXISTS "closedAt" timestamp;

CREATE INDEX IF NOT EXISTS ix_application_funder_status
  ON application ("funderOrganizationId", "applicationStatus");
