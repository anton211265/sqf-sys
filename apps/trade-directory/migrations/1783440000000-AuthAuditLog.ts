import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuthAuditLog1783440000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "auth_audit_log" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "event" character varying NOT NULL,
        "personId" integer,
        "email" character varying NOT NULL,
        "ipAddress" character varying,
        "userAgent" character varying,
        "outcome" character varying NOT NULL,
        "detail" character varying,
        "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP,
        CONSTRAINT "PK_auth_audit_log" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "auth_audit_log"`);
  }
}
