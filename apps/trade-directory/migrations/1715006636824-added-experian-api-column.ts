import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedExperianApiColumn1715006636824 implements MigrationInterface {
    name = 'AddedExperianApiColumn1715006636824'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "experian" ADD "token1" character varying`);
        await queryRunner.query(`ALTER TABLE "experian" ADD "token2" character varying`);
        await queryRunner.query(`ALTER TABLE "experian" ADD "xml" character varying`);
        await queryRunner.query(`ALTER TABLE "experian" ADD "error" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "experian" DROP COLUMN "error"`);
        await queryRunner.query(`ALTER TABLE "experian" DROP COLUMN "xml"`);
        await queryRunner.query(`ALTER TABLE "experian" DROP COLUMN "token2"`);
        await queryRunner.query(`ALTER TABLE "experian" DROP COLUMN "token1"`);
    }

}
