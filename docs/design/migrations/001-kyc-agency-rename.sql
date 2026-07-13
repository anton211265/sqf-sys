-- Phase 1b: Experian -> KYC Agency generalization (2026-07-12)
-- Run against trade-directory DB:
ALTER TABLE experian RENAME TO kyc_agency_report;
ALTER TYPE "ExperianReportTypeEnum" RENAME TO "KycReportTypeEnum";
ALTER TYPE "ExperianReportStatusEnum" RENAME TO "KycReportStatusEnum";
ALTER TYPE "ExperianReportSourceEnum" RENAME TO "KycReportSourceEnum";
CREATE TYPE "KycAgencyEnum" AS ENUM ('EXPERIAN');
ALTER TABLE kyc_agency_report ADD COLUMN IF NOT EXISTS agency "KycAgencyEnum" NOT NULL DEFAULT 'EXPERIAN';
ALTER TABLE organization RENAME COLUMN "experianBusinessSector" TO "kycBusinessSector";
ALTER TABLE organization RENAME COLUMN "experianNatureOfBusiness" TO "kycNatureOfBusiness";
-- Remap any queued outbox events to the renamed topics (idempotent):
UPDATE outbox_event SET topic = 'request_kyc_report' WHERE topic = 'request_experian_report';
UPDATE outbox_event SET topic = 'receive_kyc_report' WHERE topic = 'receive_experian_report';
ALTER SEQUENCE experian_id_seq RENAME TO kyc_agency_report_id_seq;
