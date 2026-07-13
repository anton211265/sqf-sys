-- Phase 2: trade-network tables — relationship, contract, invoice,
-- lending_product_subscription (2026-07-12). Run against trade-directory DB.

CREATE TYPE "RelationshipTypeEnum" AS ENUM ('SUPPLIES_TO');
CREATE TYPE "RelationshipStatusEnum" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "ContractTypeEnum" AS ENUM ('FACILITY_AGREEMENT', 'COMMERCIAL');
CREATE TYPE "ContractStatusEnum" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED');
CREATE TYPE "LendingProductEnum" AS ENUM ('AR_FINANCE', 'SUPPLY_CHAIN_FINANCE', 'INVOICE_FACTORING', 'TERM_LOAN');
CREATE TYPE "InvoiceStatusEnum" AS ENUM ('UPLOADED', 'VALIDATED', 'APPROVED_FOR_FINANCE', 'PRESENTED', 'FINANCED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CLOSED', 'REJECTED');
CREATE TYPE "LendingProductSubscriptionStatusEnum" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');

CREATE TABLE relationship (
  id                      SERIAL PRIMARY KEY,
  "funderPersonaId"       INTEGER NOT NULL,
  "fromOrganizationId"    INTEGER NOT NULL REFERENCES organization(id),
  "toOrganizationId"      INTEGER NOT NULL REFERENCES organization(id),
  "relationshipType"      "RelationshipTypeEnum" NOT NULL DEFAULT 'SUPPLIES_TO',
  "paymentTermsDays"      INTEGER,
  "yearlyVolumeChangePct" NUMERIC(8,2),
  "totalTradeVolume"      NUMERIC(15,2),
  "tradeCurrency"         "CurrencyCodeEnum",
  status                  "RelationshipStatusEnum" NOT NULL DEFAULT 'ACTIVE',
  "createdAt"             TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP,
  "updatedAt"             TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP,
  CONSTRAINT uq_relationship_from_to_type UNIQUE ("fromOrganizationId", "toOrganizationId", "relationshipType")
);
CREATE INDEX idx_relationship_funder ON relationship ("funderPersonaId");

CREATE TABLE contract (
  id                          SERIAL PRIMARY KEY,
  "funderPersonaId"           INTEGER NOT NULL,
  "contractType"              "ContractTypeEnum" NOT NULL,
  "firstPartyOrganizationId"  INTEGER NOT NULL REFERENCES organization(id),
  "secondPartyOrganizationId" INTEGER NOT NULL REFERENCES organization(id),
  "relationshipId"            INTEGER REFERENCES relationship(id),
  "lendingProduct"            "LendingProductEnum",
  reference                   VARCHAR,
  "startDate"                 DATE,
  "endDate"                   DATE,
  "contractValue"             NUMERIC(15,2),
  currency                    "CurrencyCodeEnum",
  "paymentTermsDays"          INTEGER,
  status                      "ContractStatusEnum" NOT NULL DEFAULT 'DRAFT',
  "documentReference"         VARCHAR,
  "createdAt"                 TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP,
  "updatedAt"                 TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP
);
CREATE INDEX idx_contract_funder ON contract ("funderPersonaId");

CREATE TABLE invoice (
  id                        SERIAL PRIMARY KEY,
  "funderPersonaId"         INTEGER NOT NULL,
  "invoiceNumber"           VARCHAR NOT NULL,
  "issuerOrganizationId"    INTEGER NOT NULL REFERENCES organization(id),
  "debtorOrganizationId"    INTEGER NOT NULL REFERENCES organization(id),
  "relationshipId"          INTEGER REFERENCES relationship(id),
  "contractId"              INTEGER REFERENCES contract(id),
  "lendingProduct"          "LendingProductEnum",
  amount                    NUMERIC(15,2) NOT NULL,
  currency                  "CurrencyCodeEnum" NOT NULL,
  "issueDate"               DATE NOT NULL,
  "dueDate"                 DATE NOT NULL,
  status                    "InvoiceStatusEnum" NOT NULL DEFAULT 'UPLOADED',
  "uploadedByPersonId"      INTEGER,
  "sourceDocumentReference" VARCHAR,
  "ownershipTransferredAt"  TIMESTAMP WITHOUT TIME ZONE,
  "settledAt"               TIMESTAMP WITHOUT TIME ZONE,
  "createdAt"               TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP,
  "updatedAt"               TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP,
  CONSTRAINT uq_invoice_funder_issuer_number UNIQUE ("funderPersonaId", "issuerOrganizationId", "invoiceNumber")
);
CREATE INDEX idx_invoice_funder ON invoice ("funderPersonaId");
CREATE INDEX idx_invoice_status ON invoice (status);

CREATE TABLE lending_product_subscription (
  id                   SERIAL PRIMARY KEY,
  "funderPersonaId"    INTEGER NOT NULL,
  "clientPersonaId"    INTEGER NOT NULL REFERENCES client_persona(id),
  product              "LendingProductEnum" NOT NULL,
  "facilityContractId" INTEGER REFERENCES contract(id),
  status               "LendingProductSubscriptionStatusEnum" NOT NULL DEFAULT 'ACTIVE',
  "createdAt"          TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP,
  "updatedAt"          TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP,
  CONSTRAINT uq_subscription_client_product UNIQUE ("clientPersonaId", product)
);
CREATE INDEX idx_subscription_funder ON lending_product_subscription ("funderPersonaId");
