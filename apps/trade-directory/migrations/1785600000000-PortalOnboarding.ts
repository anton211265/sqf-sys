import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Customer Portal pass 1 (2026-07-24): immutable disclaimer-acceptance
 * records for the public new-user application funnel
 * (docs/design/customer-portal-annotation.md). Append-only table —
 * INSERT-only DB grant is a Terraform-phase item, same as the audit tables.
 */
export class PortalOnboarding1785600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "disclaimer_acceptance" (
        "id" SERIAL PRIMARY KEY,
        "email" varchar NOT NULL,
        "person_id" integer,
        "disclaimer_code" varchar NOT NULL,
        "disclaimer_hash" varchar NOT NULL,
        "accepted_terms" boolean NOT NULL,
        "accepted_privacy" boolean NOT NULL,
        "corporate_email_flagged" boolean NOT NULL DEFAULT false,
        "ip_address" varchar,
        "user_agent" varchar,
        "created_at" timestamp NOT NULL DEFAULT LOCALTIMESTAMP
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "ix_disclaimer_acceptance_email"
        ON "disclaimer_acceptance" ("email")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "disclaimer_acceptance"`);
  }
}
