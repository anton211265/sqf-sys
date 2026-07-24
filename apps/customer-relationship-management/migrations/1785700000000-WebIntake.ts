import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Customer Portal pass 1 (2026-07-24): local projection of web-intake
 * applications for the RM Supervisor "new applicants (web)" queue —
 * populated by the APPLICATION_SCORED Kafka consumer (risk-operation owns
 * the applications; this table is a read-model plus the RM assignment,
 * which is a CRM-owned concern).
 */
export class WebIntake1785700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "applicant_intake" (
        "id" SERIAL PRIMARY KEY,
        "funderOrganizationId" integer NOT NULL,
        "applicationId" integer NOT NULL UNIQUE,
        "applicationNumber" varchar NOT NULL,
        "organizationId" integer NOT NULL,
        "companyName" varchar,
        "productCode" varchar,
        "filter1Score" numeric,
        "filter1Category" varchar,
        "result" varchar NOT NULL,
        "overridden" boolean NOT NULL DEFAULT false,
        "assignedRmPersonId" integer,
        "submittedAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP,
        "updatedAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "ix_applicant_intake_funder"
        ON "applicant_intake" ("funderOrganizationId", "result")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "applicant_intake"`);
  }
}
