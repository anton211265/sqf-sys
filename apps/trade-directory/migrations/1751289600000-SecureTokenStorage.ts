import { MigrationInterface, QueryRunner } from 'typeorm';

export class SecureTokenStorage1751289600000 implements MigrationInterface {
  name = 'SecureTokenStorage1751289600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "token" DROP COLUMN "accessToken"`);
    await queryRunner.query(`ALTER TABLE "token" RENAME COLUMN "refreshToken" TO "refreshTokenHash"`);
    await queryRunner.query(`ALTER TABLE "token" ADD "issuedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "token" ADD "lastUsedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "token" ADD "expiresAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "token" ADD "revokedAt" TIMESTAMP WITHOUT TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "token" ADD "revokedReason" CHARACTER VARYING`);
    await queryRunner.query(`ALTER TABLE "token" ADD "userAgent" CHARACTER VARYING`);
    await queryRunner.query(`ALTER TABLE "token" ADD "ipAddress" CHARACTER VARYING`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "token" DROP COLUMN "ipAddress"`);
    await queryRunner.query(`ALTER TABLE "token" DROP COLUMN "userAgent"`);
    await queryRunner.query(`ALTER TABLE "token" DROP COLUMN "revokedReason"`);
    await queryRunner.query(`ALTER TABLE "token" DROP COLUMN "revokedAt"`);
    await queryRunner.query(`ALTER TABLE "token" DROP COLUMN "expiresAt"`);
    await queryRunner.query(`ALTER TABLE "token" DROP COLUMN "lastUsedAt"`);
    await queryRunner.query(`ALTER TABLE "token" DROP COLUMN "issuedAt"`);
    await queryRunner.query(`ALTER TABLE "token" RENAME COLUMN "refreshTokenHash" TO "refreshToken"`);
    await queryRunner.query(`ALTER TABLE "token" ADD "accessToken" CHARACTER VARYING NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "token" ALTER COLUMN "accessToken" DROP DEFAULT`);
  }
}
