import { MigrationInterface, QueryRunner } from "typeorm";

export class PersonNameNullable1710844246405 implements MigrationInterface {
    name = 'PersonNameNullable1710844246405'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "person" ALTER COLUMN "name" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "person" ALTER COLUMN "name" SET NOT NULL`);
    }

}
