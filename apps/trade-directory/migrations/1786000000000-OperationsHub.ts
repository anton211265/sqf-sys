import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Operations Hub pass 1 (2026-07-24): Product Approval stage — operations
 * cases (operator maker -> operator checker -> Operations Manager ->
 * client passkey signature -> facility executed) + 4 new keys.
 */
export class OperationsHub1786000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permission" ("permKey", "permCategory", "permDescription") VALUES
      ('ops_queue_view',         'Operations', 'View the operations case queue and workspaces'),
      ('ops_agreements_manage',  'Operations', 'Pick up cases and prepare the facility agreement pack (operator maker)'),
      ('ops_agreements_check',   'Operations', 'Verify a prepared agreement pack as a second operator (cannot be the maker)'),
      ('ops_agreements_approve', 'Operations', 'Approve agreement packs for client signature (Operations Manager)')
      ON CONFLICT ("permKey") DO NOTHING
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "operations_case" (
        "id" SERIAL PRIMARY KEY,
        "funderOrganizationId" integer NOT NULL,
        "organizationId" integer NOT NULL,
        "companyName" varchar,
        "applicationId" integer,
        "offerId" integer,
        "productCode" varchar NOT NULL,
        "status" varchar NOT NULL DEFAULT 'NEW',
        "operatorPersonId" integer,
        "checkerPersonId" integer,
        "approverPersonId" integer,
        "agreementText" text,
        "agreementSha256" varchar,
        "agreementTerms" jsonb,
        "signedByPersonId" integer,
        "signedCredentialId" varchar,
        "signedAt" timestamp,
        "signatureIp" varchar,
        "contractId" integer,
        "resolutionNote" varchar(300),
        "createdAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP,
        "updatedAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_ops_case_live_org" ON "operations_case" ("organizationId")
      WHERE "status" IN ('NEW','IN_PREPARATION','PENDING_CHECK','CHECKED','PENDING_SIGNATURE')
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "ix_ops_case_funder_status" ON "operations_case" ("funderOrganizationId", "status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "operations_case"`);
    await queryRunner.query(`
      DELETE FROM "permission" WHERE "permKey" IN
      ('ops_queue_view','ops_agreements_manage','ops_agreements_check','ops_agreements_approve')
    `);
  }
}
