import { MigrationInterface, QueryRunner } from 'typeorm';

export class TokenFamilyId1783470000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Backfill existing rows with a unique family per row so NOT NULL constraint holds
    await queryRunner.query(`
      ALTER TABLE "token" ADD "tokenFamilyId" uuid NOT NULL DEFAULT gen_random_uuid()
    `);
    // Remove the default — new rows must supply an explicit value from the app
    await queryRunner.query(`
      ALTER TABLE "token" ALTER COLUMN "tokenFamilyId" DROP DEFAULT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "token" DROP COLUMN "tokenFamilyId"`);
  }
}
