-- Align `invoice` with the OASIS UBL 2.5 Invoice schema (2026-07-13).
-- Source: SQF ARCHITECTURE/SCEHMA/ubl-invoice-{schema.json,data-dictionary.md}.
-- Run against trade-directory DB.
--
-- Design decisions (confirmed with Tony):
--   - `party` is a NEW table, separate from `organization` — an immutable
--     snapshot of a party's name/address/VAT as they appeared on a specific
--     invoice document, with an optional organizationId link back to the
--     live SQF Organization. Editing Organization later must never rewrite
--     an already-issued invoice.
--   - The SQF lending-workflow fields (funderPersonaId, lendingProduct,
--     status machine, ownership/settlement timestamps) stay merged onto the
--     same `invoice` table alongside the new UBL header columns — one row
--     per invoice, one source of truth.
--
-- Pre-production: no data-preservation constraints. The one existing test
-- invoice predates the party/line/tax model and cannot be backfilled
-- (no source lines to derive amounts from), so it is truncated here.

TRUNCATE TABLE invoice CASCADE;

CREATE TYPE "InvoiceTypeCodeEnum" AS ENUM ('380', '381', '384', '389', '393', '395');
CREATE TYPE "TaxCategoryEnum" AS ENUM ('S', 'Z', 'E', 'AE');

CREATE TABLE party (
  id                     SERIAL PRIMARY KEY,
  "organizationId"       INTEGER REFERENCES organization(id),
  "endpointId"           VARCHAR,
  "endpointSchemeId"     VARCHAR,
  "partyName"            VARCHAR,
  "registrationName"     VARCHAR,
  "companyId"            VARCHAR,
  "companyLegalForm"     VARCHAR,
  "vatNumber"            VARCHAR,
  "taxSchemeId"          VARCHAR,
  "streetName"           VARCHAR,
  "additionalStreetName" VARCHAR,
  "buildingNumber"       VARCHAR,
  "cityName"             VARCHAR,
  "postalZone"           VARCHAR,
  "countrySubentity"     VARCHAR,
  "countryCode"          "CountryCodeEnum",
  "contactName"          VARCHAR,
  "contactTelephone"     VARCHAR,
  "contactEmail"         VARCHAR,
  "createdAt"            TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP,
  "updatedAt"            TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP
);
CREATE INDEX idx_party_organization ON party ("organizationId");
CREATE INDEX idx_party_vat_number ON party ("vatNumber");

-- ---------------- invoice header: drop the old flat amount/currency, add UBL fields ----------------

ALTER TABLE invoice
  DROP COLUMN IF EXISTS amount,
  DROP COLUMN IF EXISTS currency;

ALTER TABLE invoice
  ADD COLUMN "ublVersionId"               VARCHAR DEFAULT '2.5',
  ADD COLUMN "customizationId"            VARCHAR,
  ADD COLUMN "profileId"                  VARCHAR,
  ADD COLUMN "issueTime"                  TIME,
  ADD COLUMN "invoiceTypeCode"            "InvoiceTypeCodeEnum" NOT NULL DEFAULT '380',
  ADD COLUMN "taxPointDate"               DATE,
  ADD COLUMN "documentCurrencyCode"       "CurrencyCodeEnum",
  ADD COLUMN "taxCurrencyCode"            "CurrencyCodeEnum",
  ADD COLUMN "buyerReference"             VARCHAR,
  ADD COLUMN "invoicePeriodStart"         DATE,
  ADD COLUMN "invoicePeriodEnd"           DATE,
  ADD COLUMN "orderReferenceId"           VARCHAR,
  ADD COLUMN "salesOrderId"               VARCHAR,
  ADD COLUMN "contractDocumentReferenceId" VARCHAR,
  ADD COLUMN "projectReferenceId"         VARCHAR,
  ADD COLUMN "deliveryActualDate"         DATE,
  ADD COLUMN "deliveryLocationId"         VARCHAR,
  ADD COLUMN "supplierPartyId"            INTEGER REFERENCES party(id),
  ADD COLUMN "customerPartyId"            INTEGER REFERENCES party(id),
  ADD COLUMN "payeePartyId"               INTEGER REFERENCES party(id),
  ADD COLUMN "taxRepresentativePartyId"   INTEGER REFERENCES party(id),
  ADD COLUMN "lineExtensionAmount"        NUMERIC(15,2),
  ADD COLUMN "taxExclusiveAmount"         NUMERIC(15,2),
  ADD COLUMN "taxInclusiveAmount"         NUMERIC(15,2),
  ADD COLUMN "allowanceTotalAmount"       NUMERIC(15,2),
  ADD COLUMN "chargeTotalAmount"          NUMERIC(15,2),
  ADD COLUMN "prepaidAmount"              NUMERIC(15,2),
  ADD COLUMN "payableRoundingAmount"      NUMERIC(15,2),
  ADD COLUMN "payableAmount"              NUMERIC(15,2);

-- Table is empty (truncated above) so these NOT NULLs are safe to apply now.
ALTER TABLE invoice
  ALTER COLUMN "documentCurrencyCode" SET NOT NULL,
  ALTER COLUMN "supplierPartyId" SET NOT NULL,
  ALTER COLUMN "customerPartyId" SET NOT NULL,
  ALTER COLUMN "lineExtensionAmount" SET NOT NULL,
  ALTER COLUMN "taxExclusiveAmount" SET NOT NULL,
  ALTER COLUMN "taxInclusiveAmount" SET NOT NULL,
  ALTER COLUMN "payableAmount" SET NOT NULL;

-- ---------------- child tables ----------------

CREATE TABLE invoice_line (
  id                                  SERIAL PRIMARY KEY,
  "invoiceId"                         INTEGER NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
  "lineNumber"                        VARCHAR NOT NULL,
  note                                TEXT,
  "invoicedQuantity"                  NUMERIC(15,4) NOT NULL,
  "invoicedQuantityUnitCode"          VARCHAR NOT NULL,
  "lineExtensionAmount"               NUMERIC(15,2) NOT NULL,
  "lineExtensionAmountCurrencyCode"   "CurrencyCodeEnum" NOT NULL,
  "accountingCost"                    VARCHAR,
  "invoicePeriodStart"                DATE,
  "invoicePeriodEnd"                  DATE,
  "orderLineReferenceId"              VARCHAR,
  "itemName"                          VARCHAR NOT NULL,
  "itemDescription"                   TEXT,
  "sellersItemId"                     VARCHAR,
  "standardItemId"                    VARCHAR,
  "standardItemIdSchemeId"            VARCHAR,
  "priceAmount"                       NUMERIC(15,4) NOT NULL,
  "priceAmountCurrencyCode"           "CurrencyCodeEnum" NOT NULL,
  "baseQuantity"                      NUMERIC(15,4),
  "baseQuantityUnitCode"              VARCHAR,
  CONSTRAINT uq_invoice_line_number UNIQUE ("invoiceId", "lineNumber")
);
CREATE INDEX idx_invoice_line_invoice ON invoice_line ("invoiceId");

CREATE TABLE invoice_line_tax_category (
  id                SERIAL PRIMARY KEY,
  "invoiceLineId"   INTEGER NOT NULL REFERENCES invoice_line(id) ON DELETE CASCADE,
  "taxCategoryId"   "TaxCategoryEnum" NOT NULL,
  "taxPercent"      NUMERIC(5,2),
  "taxSchemeId"     VARCHAR NOT NULL DEFAULT 'VAT'
);
CREATE INDEX idx_line_tax_category_line ON invoice_line_tax_category ("invoiceLineId");

CREATE TABLE invoice_line_additional_item_property (
  id                SERIAL PRIMARY KEY,
  "invoiceLineId"   INTEGER NOT NULL REFERENCES invoice_line(id) ON DELETE CASCADE,
  "propertyName"    VARCHAR NOT NULL,
  "propertyValue"   VARCHAR
);
CREATE INDEX idx_line_item_property_line ON invoice_line_additional_item_property ("invoiceLineId");

CREATE TABLE invoice_note (
  id            SERIAL PRIMARY KEY,
  "invoiceId"   INTEGER NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
  "sequenceNo"  SMALLINT NOT NULL,
  "noteText"    TEXT NOT NULL
);
CREATE INDEX idx_invoice_note_invoice ON invoice_note ("invoiceId");

CREATE TABLE invoice_additional_document_reference (
  id                     SERIAL PRIMARY KEY,
  "invoiceId"            INTEGER NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
  "documentId"           VARCHAR,
  "documentType"         VARCHAR,
  "attachmentMimeCode"   VARCHAR,
  "attachmentFilename"   VARCHAR,
  "attachmentBinary"     BYTEA,
  "externalReferenceUri" VARCHAR
);
CREATE INDEX idx_invoice_doc_ref_invoice ON invoice_additional_document_reference ("invoiceId");

CREATE TABLE invoice_payment_means (
  id                          SERIAL PRIMARY KEY,
  "invoiceId"                 INTEGER NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
  "paymentMeansCode"          VARCHAR NOT NULL,
  "paymentDueDate"            DATE,
  "paymentId"                 VARCHAR,
  "payeeAccountId"            VARCHAR,
  "payeeAccountName"          VARCHAR,
  "financialInstitutionId"    VARCHAR,
  "financialInstitutionName"  VARCHAR
);
CREATE INDEX idx_invoice_payment_means_invoice ON invoice_payment_means ("invoiceId");

CREATE TABLE invoice_tax_subtotal (
  id                            SERIAL PRIMARY KEY,
  "invoiceId"                   INTEGER NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
  "taxableAmount"                NUMERIC(15,2) NOT NULL,
  "taxableAmountCurrencyCode"    "CurrencyCodeEnum" NOT NULL,
  "taxAmount"                    NUMERIC(15,2) NOT NULL,
  "taxAmountCurrencyCode"        "CurrencyCodeEnum" NOT NULL,
  "taxCategoryId"                "TaxCategoryEnum" NOT NULL,
  "taxPercent"                   NUMERIC(5,2),
  "taxSchemeId"                  VARCHAR NOT NULL DEFAULT 'VAT',
  "taxExemptionReason"           VARCHAR
);
CREATE INDEX idx_invoice_tax_subtotal_invoice ON invoice_tax_subtotal ("invoiceId");

CREATE TABLE invoice_allowance_charge (
  id                        SERIAL PRIMARY KEY,
  "invoiceId"               INTEGER REFERENCES invoice(id) ON DELETE CASCADE,
  "invoiceLineId"           INTEGER REFERENCES invoice_line(id) ON DELETE CASCADE,
  "chargeIndicator"         BOOLEAN NOT NULL,
  "reasonCode"              VARCHAR,
  reason                    VARCHAR,
  "multiplierFactorNumeric" NUMERIC(7,4),
  amount                    NUMERIC(15,2) NOT NULL,
  "amountCurrencyCode"      "CurrencyCodeEnum" NOT NULL,
  "baseAmount"              NUMERIC(15,2),
  "baseAmountCurrencyCode"  "CurrencyCodeEnum",
  "taxCategoryId"           "TaxCategoryEnum",
  "taxPercent"              NUMERIC(5,2),
  "taxSchemeId"             VARCHAR,
  CONSTRAINT chk_allowance_charge_one_parent CHECK (
    ((("invoiceId" IS NOT NULL))::int + (("invoiceLineId" IS NOT NULL))::int) = 1
  )
);
CREATE INDEX idx_allowance_charge_invoice ON invoice_allowance_charge ("invoiceId");
CREATE INDEX idx_allowance_charge_line ON invoice_allowance_charge ("invoiceLineId");
