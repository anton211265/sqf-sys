-- Phase 0: LCM legacy subsystem removal (2026-07-12)
-- Run against risk-operation DB:
DROP TABLE IF EXISTS facility CASCADE;
DROP TABLE IF EXISTS client_awarder_contract CASCADE;
DROP TABLE IF EXISTS application_public CASCADE;
-- Columns removed from the application entity (LCM loan-form fields):
ALTER TABLE application
  DROP COLUMN IF EXISTS "clientAwarderContractId",
  DROP COLUMN IF EXISTS "nextOfKins",
  DROP COLUMN IF EXISTS "corporateGuarantors",
  DROP COLUMN IF EXISTS "clientContactPersons",
  DROP COLUMN IF EXISTS "clientBankAccounts",
  DROP COLUMN IF EXISTS "leadSource",
  DROP COLUMN IF EXISTS "numberOfContractSecured",
  DROP COLUMN IF EXISTS "valueOfContractSecured",
  DROP COLUMN IF EXISTS "valueOfContractSecuredCurrency",
  DROP COLUMN IF EXISTS "applicationFee",
  DROP COLUMN IF EXISTS "latePaymentCharges",
  DROP COLUMN IF EXISTS "administrationFee",
  DROP COLUMN IF EXISTS "processingFee",
  DROP COLUMN IF EXISTS "remittanceCharges",
  DROP COLUMN IF EXISTS "collectionFee",
  DROP COLUMN IF EXISTS "eMandateFee",
  DROP COLUMN IF EXISTS "facilityFee",
  DROP COLUMN IF EXISTS "supportLetterCharges",
  DROP COLUMN IF EXISTS "letterOfUndertakingCharges",
  DROP COLUMN IF EXISTS "bankGuaranteeServiceFee",
  DROP COLUMN IF EXISTS "letterOfCreditServiceFee",
  DROP COLUMN IF EXISTS "customerRetention",
  DROP COLUMN IF EXISTS "financialAdvisory",
  DROP COLUMN IF EXISTS "retainerFee",
  DROP COLUMN IF EXISTS "arrangerFee",
  DROP COLUMN IF EXISTS "stampingFee",
  DROP COLUMN IF EXISTS "sinkingFund",
  DROP COLUMN IF EXISTS "approvalFee";
DROP TYPE IF EXISTS "LeadSourceEnum";
