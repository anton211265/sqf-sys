import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Product Configurator initial schema (2026-07-24), from the approved spec
 * SQF ARCHITECTURE/product_configurator.md with the build-time adaptations
 * recorded on each entity in src/models: surrogate int PKs +
 * per-funder unique product codes (shared dev DB), bare trade-directory
 * organization ids instead of a local clients table, rate-card
 * DRAFT/PUBLISHED/ARCHIVED lifecycle, app-side same-transaction audit
 * writes (no PG triggers), inline template bodies for the Handlebars
 * previewer, plus the house-standard transactional outbox table.
 */
export class InitialSchema1785000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "product" (
        "id" SERIAL PRIMARY KEY,
        "productCode" varchar(10) NOT NULL,
        "productName" varchar(100) NOT NULL,
        "description" text,
        "isCustomBespoke" boolean NOT NULL DEFAULT false,
        "clientOwnerOrganizationId" integer,
        "funderOrganizationId" integer NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP,
        "updatedAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP,
        CONSTRAINT "UQ_product_funder_code" UNIQUE ("funderOrganizationId", "productCode")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "master_rate_card" (
        "id" SERIAL PRIMARY KEY,
        "productId" integer NOT NULL REFERENCES "product"("id") ON DELETE RESTRICT,
        "versionNumber" integer NOT NULL DEFAULT 1,
        "status" varchar NOT NULL DEFAULT 'DRAFT',
        "minTenureDays" integer NOT NULL DEFAULT 30,
        "maxTenureDays" integer NOT NULL DEFAULT 360,
        "interestRateApr" numeric(5,4),
        "advanceRatePct" numeric(5,4),
        "discountFeePct" numeric(5,4),
        "oneTimeAdminFee" numeric(15,2) NOT NULL DEFAULT 0,
        "reserveRetainPct" numeric(5,4) NOT NULL DEFAULT 0,
        "formulaType" varchar,
        "customVariables" jsonb,
        "configuredByAgent" boolean NOT NULL DEFAULT false,
        "publishedAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP,
        CONSTRAINT "unique_product_version" UNIQUE ("productId", "versionNumber")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "legal_document_template" (
        "id" SERIAL PRIMARY KEY,
        "documentCode" varchar(50) NOT NULL,
        "documentName" varchar(150) NOT NULL,
        "templateFileUrl" varchar,
        "templateBody" text,
        "isRequiredDefault" boolean NOT NULL DEFAULT true,
        "funderOrganizationId" integer NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP,
        CONSTRAINT "UQ_template_funder_code" UNIQUE ("funderOrganizationId", "documentCode")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "product_document_mapping" (
        "productId" integer NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
        "templateId" integer NOT NULL REFERENCES "legal_document_template"("id") ON DELETE CASCADE,
        PRIMARY KEY ("productId", "templateId")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "client_product_assignment" (
        "id" SERIAL PRIMARY KEY,
        "organizationId" integer NOT NULL,
        "productId" integer NOT NULL REFERENCES "product"("id") ON DELETE RESTRICT,
        "funderOrganizationId" integer NOT NULL,
        "sourceRateCardId" integer,
        "sourceVersionNumber" integer,
        "assignedInterestRate" numeric(5,4) NOT NULL,
        "assignedAdvanceRate" numeric(5,4),
        "assignedDiscountFee" numeric(5,4),
        "assignedAdminFee" numeric(15,2) NOT NULL DEFAULT 0,
        "assignedReservePct" numeric(5,4),
        "tenureDaysLimit" integer NOT NULL,
        "status" varchar NOT NULL DEFAULT 'ACTIVE',
        "assignedAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_assignment_org" ON "client_product_assignment" ("organizationId")`,
    );

    await queryRunner.query(`
      CREATE TABLE "product_config_audit_log" (
        "id" SERIAL PRIMARY KEY,
        "targetTable" varchar NOT NULL,
        "entityId" varchar NOT NULL,
        "productId" integer,
        "actorType" varchar NOT NULL,
        "actorIdentifier" varchar NOT NULL,
        "actionPerformed" varchar NOT NULL,
        "oldValues" jsonb,
        "newValues" jsonb NOT NULL,
        "changeReason" text,
        "funderOrganizationId" integer NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_audit_product" ON "product_config_audit_log" ("productId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_actor" ON "product_config_audit_log" ("actorIdentifier")`,
    );

    await queryRunner.query(
      `CREATE TYPE "OutboxEventStatusEnum" AS ENUM ('pending', 'sent', 'failed')`,
    );
    await queryRunner.query(`
      CREATE TABLE "outbox_event" (
        "id" uuid PRIMARY KEY,
        "topic" varchar NOT NULL,
        "payload" jsonb NOT NULL,
        "status" "OutboxEventStatusEnum" NOT NULL DEFAULT 'pending',
        "created_at" timestamp NOT NULL DEFAULT LOCALTIMESTAMP,
        "sent_at" timestamp
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_outbox_status" ON "outbox_event" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "outbox_event"`);
    await queryRunner.query(`DROP TYPE "OutboxEventStatusEnum"`);
    await queryRunner.query(`DROP TABLE "product_config_audit_log"`);
    await queryRunner.query(`DROP TABLE "client_product_assignment"`);
    await queryRunner.query(`DROP TABLE "product_document_mapping"`);
    await queryRunner.query(`DROP TABLE "legal_document_template"`);
    await queryRunner.query(`DROP TABLE "master_rate_card"`);
    await queryRunner.query(`DROP TABLE "product"`);
  }
}
