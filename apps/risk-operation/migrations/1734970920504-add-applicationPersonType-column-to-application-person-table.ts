import { MigrationInterface, QueryRunner } from "typeorm";

export class AddApplicationPersonTypeColumnToApplicationPersonTable1734970920504 implements MigrationInterface {
    name = 'AddApplicationPersonTypeColumnToApplicationPersonTable1734970920504'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application_person" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "application_person" DROP COLUMN "roles"`);
        await queryRunner.query(`CREATE TYPE "public"."ApplicationPersonTypeEnum" AS ENUM('PIC', 'DIRECTOR', 'SHAREHOLDER', 'GUARANTOR')`);
        await queryRunner.query(`ALTER TABLE "application_person" ADD "applicationPersonType" "public"."ApplicationPersonTypeEnum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application_person" DROP COLUMN "applicationPersonType"`);
        await queryRunner.query(`DROP TYPE "public"."ApplicationPersonTypeEnum"`);
        await queryRunner.query(`ALTER TABLE "application_person" ADD "roles" jsonb`);
        await queryRunner.query(`ALTER TABLE "application_person" ADD "name" character varying(255) NOT NULL`);
    }

}
