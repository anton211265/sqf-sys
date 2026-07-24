import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * CRM domain (2026-07-24), from the signed-off annotation
 * (docs/design/crm-sitemap-annotation.md): the lead→prospect→deal funnel,
 * append-only deal stage history (conversion analytics + audit), and site
 * visit reports. All rows funder-scoped; organizationId/personId are bare
 * trade-directory references (house rule). outbox_event added because this
 * service now PUBLISHES for the first time (promotion emits SEND_EMAIL +
 * SLA_TIMER_START); processed_event already existed for the dormant
 * CREATE_CLIENT_ASSIGNEE consumer.
 */
export class CrmDomain1785400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "lead" (
        "id" SERIAL PRIMARY KEY,
        "funderOrganizationId" integer NOT NULL,
        "companyName" varchar(255) NOT NULL,
        "registrationNumber" varchar(100),
        "contactName" varchar(150),
        "contactEmail" varchar(255),
        "contactPhone" varchar(50),
        "source" varchar(60),
        "status" varchar NOT NULL DEFAULT 'LEAD',
        "ownerRmPersonId" integer NOT NULL,
        "organizationId" integer,
        "notes" text,
        "qualifiedAt" timestamp,
        "promotedAt" timestamp,
        "closedAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP,
        "updatedAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_lead_owner" ON "lead" ("funderOrganizationId", "ownerRmPersonId", "status")`,
    );

    await queryRunner.query(`
      CREATE TABLE "deal" (
        "id" SERIAL PRIMARY KEY,
        "funderOrganizationId" integer NOT NULL,
        "leadId" integer NOT NULL REFERENCES "lead"("id") ON DELETE CASCADE,
        "ownerRmPersonId" integer NOT NULL,
        "title" varchar(200) NOT NULL,
        "productCode" varchar(10),
        "dealValue" numeric(15,2),
        "expectedCloseDate" date,
        "stage" varchar NOT NULL DEFAULT 'QUALIFIED',
        "notes" text,
        "closedAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP,
        "updatedAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_deal_owner" ON "deal" ("funderOrganizationId", "ownerRmPersonId", "stage")`,
    );

    await queryRunner.query(`
      CREATE TABLE "deal_stage_history" (
        "id" SERIAL PRIMARY KEY,
        "dealId" integer NOT NULL REFERENCES "deal"("id") ON DELETE CASCADE,
        "fromStage" varchar,
        "toStage" varchar NOT NULL,
        "movedByPersonId" integer NOT NULL,
        "movedAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "site_visit_report" (
        "id" SERIAL PRIMARY KEY,
        "funderOrganizationId" integer NOT NULL,
        "leadId" integer REFERENCES "lead"("id") ON DELETE SET NULL,
        "organizationId" integer,
        "visitedAt" date NOT NULL,
        "summary" varchar(300) NOT NULL,
        "findings" text,
        "reportedByPersonId" integer NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP
      )
    `);

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
    await queryRunner.query(`DROP TABLE "site_visit_report"`);
    await queryRunner.query(`DROP TABLE "deal_stage_history"`);
    await queryRunner.query(`DROP TABLE "deal"`);
    await queryRunner.query(`DROP TABLE "lead"`);
  }
}
