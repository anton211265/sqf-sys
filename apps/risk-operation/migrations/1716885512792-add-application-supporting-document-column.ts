import { MigrationInterface, QueryRunner } from "typeorm";

export class AddApplicationSupportingDocumentColumn1716885512792 implements MigrationInterface {
    name = 'AddApplicationSupportingDocumentColumn1716885512792'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application_supporting_document" ADD "isVerified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TYPE "public"."ApplicationStatusEnum" RENAME TO "ApplicationStatusEnum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."ApplicationStatusEnum" AS ENUM('DRAFT', 'PENDING_EXPERIAN_CONSENT', 'PENDING_EXPERIAN_REPORT', 'PENDING_CLIENT_SUBMISSION', 'PENDING_ASSIGNEE_REVIEW', 'PENDING_RISK_REVIEW')`);
        await queryRunner.query(`ALTER TABLE "application" ALTER COLUMN "applicationStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "application" ALTER COLUMN "applicationStatus" TYPE "public"."ApplicationStatusEnum" USING "applicationStatus"::"text"::"public"."ApplicationStatusEnum"`);
        await queryRunner.query(`ALTER TABLE "application" ALTER COLUMN "applicationStatus" SET DEFAULT 'DRAFT'`);
        await queryRunner.query(`DROP TYPE "public"."ApplicationStatusEnum_old"`);
        await queryRunner.query(`ALTER TABLE "application_supporting_document" DROP CONSTRAINT "FK_20c4be58213e8af3ba5b2ad49e0"`);
        await queryRunner.query(`ALTER TABLE "application_supporting_document" ALTER COLUMN "applicationId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "application_supporting_document" ADD CONSTRAINT "FK_20c4be58213e8af3ba5b2ad49e0" FOREIGN KEY ("applicationId") REFERENCES "application"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application_supporting_document" DROP CONSTRAINT "FK_20c4be58213e8af3ba5b2ad49e0"`);
        await queryRunner.query(`ALTER TABLE "application_supporting_document" ALTER COLUMN "applicationId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "application_supporting_document" ADD CONSTRAINT "FK_20c4be58213e8af3ba5b2ad49e0" FOREIGN KEY ("applicationId") REFERENCES "application"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE TYPE "public"."ApplicationStatusEnum_old" AS ENUM('DRAFT', 'PENDING_EXPERIAN_CONSENT', 'PENDING_EXPERIAN_REPORT', 'PENDING_CLIENT_SUBMISSION', 'PENDING_ASSIGNEE_REVIEW')`);
        await queryRunner.query(`ALTER TABLE "application" ALTER COLUMN "applicationStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "application" ALTER COLUMN "applicationStatus" TYPE "public"."ApplicationStatusEnum_old" USING "applicationStatus"::"text"::"public"."ApplicationStatusEnum_old"`);
        await queryRunner.query(`ALTER TABLE "application" ALTER COLUMN "applicationStatus" SET DEFAULT 'DRAFT'`);
        await queryRunner.query(`DROP TYPE "public"."ApplicationStatusEnum"`);
        await queryRunner.query(`ALTER TYPE "public"."ApplicationStatusEnum_old" RENAME TO "ApplicationStatusEnum"`);
        await queryRunner.query(`ALTER TABLE "application_supporting_document" DROP COLUMN "isVerified"`);
    }

}
