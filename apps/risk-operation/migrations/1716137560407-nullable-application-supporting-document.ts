import { MigrationInterface, QueryRunner } from "typeorm";

export class NullableApplicationSupportingDocument1716137560407 implements MigrationInterface {
    name = 'NullableApplicationSupportingDocument1716137560407'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application_supporting_document" ALTER COLUMN "supportingDocumentType" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "application_supporting_document" ALTER COLUMN "fileExtension" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application_supporting_document" ALTER COLUMN "fileExtension" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "application_supporting_document" ALTER COLUMN "supportingDocumentType" SET NOT NULL`);
    }

}
