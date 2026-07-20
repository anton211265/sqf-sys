-- processed_event was only ever created by TypeORM synchronize in dev (the
-- lone service that still had POSTGRES_SYNCHRONIZE=true — fixed 2026-07-20).
-- This migration makes the schema fully reproducible from the SQL files.
-- Matches libs/common/src/database/processed-event.entity.ts.

CREATE TABLE IF NOT EXISTS "processed_event" (
  "id" UUID PRIMARY KEY,
  "topic" VARCHAR NOT NULL,
  "processed_at" TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP
);
