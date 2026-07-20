-- Phase 3 of the document-management redesign: transactional outbox for
-- publishing DOCUMENT_EXTRACTED events (this service published nothing
-- before). Same table shape as trade-directory's outbox_event.
--   docker compose exec -T postgres psql -U postgres -d "document-management" \
--     -f - < apps/document-management/migrations/003-outbox.sql

DO $$ BEGIN
  CREATE TYPE "OutboxEventStatusEnum" AS ENUM ('pending', 'sent', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "outbox_event" (
  "id" UUID PRIMARY KEY,
  "topic" VARCHAR NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "OutboxEventStatusEnum" NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP,
  "sent_at" TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "IDX_outbox_event_status"
  ON "outbox_event" ("status");
