import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeApplicationPersonTypeColumnNotNullInApplicationPersonTable1734972471572 implements MigrationInterface {
    name = 'MakeApplicationPersonTypeColumnNotNullInApplicationPersonTable1734972471572'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application_person" ALTER COLUMN "applicationPersonType" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application_person" ALTER COLUMN "applicationPersonType" DROP NOT NULL`);
    }

}
