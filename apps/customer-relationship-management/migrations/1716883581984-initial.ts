import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1716883581984 implements MigrationInterface {
    name = 'Initial1716883581984'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "client_assignee" ("id" SERIAL NOT NULL, "clientPersonaId" integer NOT NULL, "clientOrganizationName" character varying NOT NULL, "assigneePersonId" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp without time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp without time zone, CONSTRAINT "PK_c37adb52a62bb98a72aaf1e7084" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_6103cce153932ae70f5a55098a" ON "client_assignee" ("clientPersonaId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_6103cce153932ae70f5a55098a"`);
        await queryRunner.query(`DROP TABLE "client_assignee"`);
    }

}
