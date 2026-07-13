-- Phase 1a: Contract Awarder -> Buyer rename (2026-07-12)
-- Run against trade-directory DB:
ALTER TABLE contract_awarder_persona RENAME TO buyer_persona;
ALTER TABLE buyer_persona RENAME COLUMN "contractAwarderPersonaId" TO "buyerPersonaId";
ALTER TABLE organization RENAME COLUMN "contractAwarderPersonaId" TO "buyerPersonaId";
