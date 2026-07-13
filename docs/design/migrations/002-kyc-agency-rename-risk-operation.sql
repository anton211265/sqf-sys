-- Phase 1b: Experian -> KYC Agency generalization (2026-07-12)
-- Run against risk-operation DB:
ALTER TYPE "ApplicationStatusEnum" RENAME VALUE 'PENDING_EXPERIAN_CONSENT' TO 'PENDING_KYC_CONSENT';
ALTER TYPE "ApplicationStatusEnum" RENAME VALUE 'PENDING_EXPERIAN_REPORT' TO 'PENDING_KYC_REPORT';
UPDATE outbox_event SET topic = 'request_kyc_report' WHERE topic = 'request_experian_report';
UPDATE outbox_event SET topic = 'receive_kyc_report' WHERE topic = 'receive_experian_report';
