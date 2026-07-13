-- Phase 0: LCM legacy subsystem removal (2026-07-12)
-- Run against trade-directory DB:
DROP TABLE IF EXISTS transaction CASCADE;
DROP TABLE IF EXISTS bank_account CASCADE;
DROP TABLE IF EXISTS person_supporting_document CASCADE;
