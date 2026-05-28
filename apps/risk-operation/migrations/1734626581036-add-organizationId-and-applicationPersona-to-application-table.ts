import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrganizationIdAndApplicationPersonaToApplicationTable1734626581036 implements MigrationInterface {
    name = 'AddOrganizationIdAndApplicationPersonaToApplicationTable1734626581036'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application" ADD "organizationId" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`CREATE TYPE "public"."ApplicationPersonaEnum" AS ENUM('INVESTOR', 'BORROWER', 'SUPPLIER')`);
        await queryRunner.query(`ALTER TABLE "application" ADD "applicationPersona" "public"."ApplicationPersonaEnum"`);
        await queryRunner.query(`CREATE INDEX "IDX_88e675c3f80602005b728979e4" ON "application" ("organizationId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_88e675c3f80602005b728979e4"`);
        await queryRunner.query(`ALTER TABLE "application" DROP COLUMN "applicationPersona"`);
        await queryRunner.query(`DROP TYPE "public"."ApplicationPersonaEnum"`);
        await queryRunner.query(`ALTER TABLE "application" DROP COLUMN "organizationId"`);
    }

}
