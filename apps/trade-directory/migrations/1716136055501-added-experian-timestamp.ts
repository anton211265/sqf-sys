import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedExperianTimestamp1716136055501 implements MigrationInterface {
    name = 'AddedExperianTimestamp1716136055501'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "experian" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp without time zone`);
        await queryRunner.query(`ALTER TABLE "experian" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp without time zone`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "experian" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "experian" DROP COLUMN "createdAt"`);
    }

}
