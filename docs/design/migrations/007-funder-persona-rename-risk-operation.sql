-- Phase 1c: Factor -> Funder rename (2026-07-12)
-- Run against risk-operation DB:
ALTER TABLE application RENAME COLUMN "factorPersonaId" TO "funderPersonaId";
