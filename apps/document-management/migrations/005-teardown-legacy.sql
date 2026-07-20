-- Phase 6 of the document-management redesign: remove the legacy pipeline's
-- tables (DeepSeek extraction + prompt templates, API-key auth, webhook
-- delivery, Hedera consensus messaging). "Replace everything, preserve
-- nothing" per the agreed design (CLAUDE.md, 2026-07-19).
--   docker compose exec -T postgres psql -U postgres -d "document-management" \
--     -f - < apps/document-management/migrations/005-teardown-legacy.sql

DROP TABLE IF EXISTS "webhook_log" CASCADE;
DROP TABLE IF EXISTS "webhook" CASCADE;
DROP TABLE IF EXISTS "onchain" CASCADE;
DROP TABLE IF EXISTS "api_key" CASCADE;
DROP TABLE IF EXISTS "prompt_template" CASCADE;
DROP TABLE IF EXISTS "document_extraction" CASCADE;
