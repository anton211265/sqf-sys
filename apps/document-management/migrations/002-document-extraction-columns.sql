-- Phase 2 of the document-management redesign: Claude field extraction.
-- Run against the "document-management" database:
--   docker compose exec -T postgres psql -U postgres -d "document-management" \
--     -f - < apps/document-management/migrations/002-document-extraction-columns.sql

ALTER TABLE "document" ADD COLUMN IF NOT EXISTS "extractedData" JSONB;
ALTER TABLE "document" ADD COLUMN IF NOT EXISTS "extractionMethod" VARCHAR(20);
ALTER TABLE "document" ADD COLUMN IF NOT EXISTS "extractionError" TEXT;
ALTER TABLE "document" ADD COLUMN IF NOT EXISTS "extractedAt" TIMESTAMP;
