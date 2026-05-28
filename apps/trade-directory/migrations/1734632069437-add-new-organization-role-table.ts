import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewOrganizationRoleTable1734632069437 implements MigrationInterface {
    name = 'AddNewOrganizationRoleTable1734632069437'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "organization_role" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "description" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp without time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp without time zone, CONSTRAINT "PK_898793c988c8e4c37ca9b2214a1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "organization" ALTER COLUMN "country" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization" ALTER COLUMN "country" SET DEFAULT 'MY'`);
        await queryRunner.query(`DROP TABLE "organization_role"`);
    }

}
