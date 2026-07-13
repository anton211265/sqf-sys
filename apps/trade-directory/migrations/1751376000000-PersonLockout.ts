import { MigrationInterface, QueryRunner } from 'typeorm';

export class PersonLockout1751376000000 implements MigrationInterface {
  name = 'PersonLockout1751376000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "person" ADD "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "person" ADD "lockedUntil" TIMESTAMP WITHOUT TIME ZONE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "person" DROP COLUMN "lockedUntil"`);
    await queryRunner.query(`ALTER TABLE "person" DROP COLUMN "failedLoginAttempts"`);
  }
}
