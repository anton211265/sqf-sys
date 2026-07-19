-- Phase 1 of the document-management redesign
-- (CLAUDE.md "Planned: Document Management redesign", agreed 2026-07-19).
-- Run against the "document-management" database:
--   docker compose exec -T postgres psql -U postgres -d "document-management" \
--     -f - < apps/document-management/migrations/001-documents.sql

CREATE TABLE IF NOT EXISTS "document" (
  "id" SERIAL PRIMARY KEY,
  "documentUuid" UUID NOT NULL UNIQUE,
  "subjectOrganizationId" INTEGER NOT NULL,
  "uploaderOrgId" INTEGER NOT NULL,
  "uploadedByPersonId" INTEGER,
  "documentClass" VARCHAR(40) NOT NULL,
  "status" VARCHAR(30) NOT NULL,
  "refId" VARCHAR(100),
  "fileName" VARCHAR(255) NOT NULL,
  "mimeType" VARCHAR(100) NOT NULL,
  "fileSizeBytes" INTEGER NOT NULL,
  "sha256Hash" CHAR(64) NOT NULL,
  "bucketName" VARCHAR(100) NOT NULL,
  "objectKey" VARCHAR(255) NOT NULL,
  "rawText" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "IDX_document_subjectOrganizationId"
  ON "document" ("subjectOrganizationId");
CREATE INDEX IF NOT EXISTS "IDX_document_documentClass"
  ON "document" ("documentClass");
CREATE INDEX IF NOT EXISTS "IDX_document_status"
  ON "document" ("status");
CREATE INDEX IF NOT EXISTS "IDX_document_sha256Hash"
  ON "document" ("sha256Hash");

-- Append-only audit trail: application code only ever INSERTs here
-- (same policy as trade-directory's auth_audit_log).
CREATE TABLE IF NOT EXISTS "document_event" (
  "id" SERIAL PRIMARY KEY,
  "documentId" INTEGER NOT NULL REFERENCES "document"("id"),
  "eventType" VARCHAR(50) NOT NULL,
  "actorPersonId" INTEGER,
  "beforeStatus" VARCHAR(30),
  "afterStatus" VARCHAR(30),
  "detail" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "IDX_document_event_documentId_createdAt"
  ON "document_event" ("documentId", "createdAt");
