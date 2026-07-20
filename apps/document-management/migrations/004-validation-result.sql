-- Phase 4 of the document-management redesign: cross-validation result.
--   docker compose exec -T postgres psql -U postgres -d "document-management" \
--     -f - < apps/document-management/migrations/004-validation-result.sql

ALTER TABLE "document" ADD COLUMN IF NOT EXISTS "validationResult" JSONB;
