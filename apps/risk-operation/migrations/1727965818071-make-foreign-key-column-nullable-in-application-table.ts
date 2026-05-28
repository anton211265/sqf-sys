import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeForeignKeyColumnNullableInApplicationTable1727965818071 implements MigrationInterface {
    name = 'MakeForeignKeyColumnNullableInApplicationTable1727965818071'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application" ALTER COLUMN "clientPersonaId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "application" ALTER COLUMN "factorPersonaId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "application" ALTER COLUMN "creatorPersonId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "application" ALTER COLUMN "assigneePersonId" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application" ALTER COLUMN "assigneePersonId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "application" ALTER COLUMN "creatorPersonId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "application" ALTER COLUMN "factorPersonaId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "application" ALTER COLUMN "clientPersonaId" SET NOT NULL`);
    }

}
