-- Phase 1c: Factor -> Funder rename (2026-07-12)
-- Run against trade-directory DB:
ALTER TABLE factor_persona RENAME TO funder_persona;
ALTER TABLE funder_persona RENAME COLUMN "factorPersonaId" TO "funderPersonaId";
ALTER TABLE organization RENAME COLUMN "factorPersonaId" TO "funderPersonaId";
