import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedCrisSExperianReport1713412302546 implements MigrationInterface {
    name = 'AddedCrisSExperianReport1713412302546'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."ExperianReportStatusEnum" AS ENUM('PENDING', 'FAILED', 'SUCCESS')`);
        await queryRunner.query(`ALTER TABLE "experian" ADD "reportStatus" "public"."ExperianReportStatusEnum" NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."ExperianReportSourceEnum" AS ENUM('PHYSICAL_COPY', 'API')`);
        await queryRunner.query(`ALTER TABLE "experian" ADD "reportSource" "public"."ExperianReportSourceEnum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "experian" ADD "iScore" numeric`);
        await queryRunner.query(`ALTER TABLE "experian" ADD "summaryCreditInformation" jsonb`);
        await queryRunner.query(`ALTER TABLE "experian" ADD "detailedCreditReport" jsonb`);
        await queryRunner.query(`ALTER TABLE "experian" ADD "latestThreeApprovedFacilities" character varying`);
        await queryRunner.query(`ALTER TABLE "experian" ADD "securedFacilities" character varying`);
        await queryRunner.query(`ALTER TABLE "experian" ADD "unsecuredFacilities" character varying`);
        await queryRunner.query(`ALTER TABLE "experian" ADD "creditCard" character varying`);
        await queryRunner.query(`ALTER TABLE "experian" ADD "otherRevolvingCredits" character varying`);
        await queryRunner.query(`ALTER TABLE "experian" ADD "chargeCard" character varying`);
        await queryRunner.query(`ALTER TABLE "experian" ADD "nationalHigherEducationFinancing" character varying`);
        await queryRunner.query(`ALTER TABLE "experian" ADD "localLenders" character varying`);
        await queryRunner.query(`ALTER TABLE "experian" ADD "foreignLenders" character varying`);
        await queryRunner.query(`ALTER TABLE "experian" ADD "personId" integer`);
        await queryRunner.query(`ALTER TYPE "public"."ExperianReportTypeEnum" RENAME TO "ExperianReportTypeEnum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."ExperianReportTypeEnum" AS ENUM('COMPANY_INTELLIGENCE', 'ENHANCED_COMPANY_INTELLIGENCE', 'BUSINESS_INTELLIGENCE', 'ENHANCED_BUSINESS_INTELLIGENCE', 'C_RISK_SCORE_INTELLIGENCE', 'ENHANCED_C_RISK_SCORE_INTELLIGENCE')`);
        await queryRunner.query(`ALTER TABLE "experian" ALTER COLUMN "reportType" TYPE "public"."ExperianReportTypeEnum" USING "reportType"::"text"::"public"."ExperianReportTypeEnum"`);
        await queryRunner.query(`DROP TYPE "public"."ExperianReportTypeEnum_old"`);
        await queryRunner.query(`ALTER TABLE "experian" ADD CONSTRAINT "FK_1ef07ae8a376dc1304ff24c293a" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "experian" DROP CONSTRAINT "FK_1ef07ae8a376dc1304ff24c293a"`);
        await queryRunner.query(`CREATE TYPE "public"."ExperianReportTypeEnum_old" AS ENUM('COMPANY_INTELLIGENCE', 'ENHANCED_COMPANY_INTELLIGENCE', 'BUSINESS_INTELLIGENCE', 'ENHANCED_BUSINESS_INTELLIGENCE')`);
        await queryRunner.query(`ALTER TABLE "experian" ALTER COLUMN "reportType" TYPE "public"."ExperianReportTypeEnum_old" USING "reportType"::"text"::"public"."ExperianReportTypeEnum_old"`);
        await queryRunner.query(`DROP TYPE "public"."ExperianReportTypeEnum"`);
        await queryRunner.query(`ALTER TYPE "public"."ExperianReportTypeEnum_old" RENAME TO "ExperianReportTypeEnum"`);
        await queryRunner.query(`ALTER TABLE "experian" DROP COLUMN "personId"`);
        await queryRunner.query(`ALTER TABLE "experian" DROP COLUMN "foreignLenders"`);
        await queryRunner.query(`ALTER TABLE "experian" DROP COLUMN "localLenders"`);
        await queryRunner.query(`ALTER TABLE "experian" DROP COLUMN "nationalHigherEducationFinancing"`);
        await queryRunner.query(`ALTER TABLE "experian" DROP COLUMN "chargeCard"`);
        await queryRunner.query(`ALTER TABLE "experian" DROP COLUMN "otherRevolvingCredits"`);
        await queryRunner.query(`ALTER TABLE "experian" DROP COLUMN "creditCard"`);
        await queryRunner.query(`ALTER TABLE "experian" DROP COLUMN "unsecuredFacilities"`);
        await queryRunner.query(`ALTER TABLE "experian" DROP COLUMN "securedFacilities"`);
        await queryRunner.query(`ALTER TABLE "experian" DROP COLUMN "latestThreeApprovedFacilities"`);
        await queryRunner.query(`ALTER TABLE "experian" DROP COLUMN "detailedCreditReport"`);
        await queryRunner.query(`ALTER TABLE "experian" DROP COLUMN "summaryCreditInformation"`);
        await queryRunner.query(`ALTER TABLE "experian" DROP COLUMN "iScore"`);
        await queryRunner.query(`ALTER TABLE "experian" DROP COLUMN "reportSource"`);
        await queryRunner.query(`DROP TYPE "public"."ExperianReportSourceEnum"`);
        await queryRunner.query(`ALTER TABLE "experian" DROP COLUMN "reportStatus"`);
        await queryRunner.query(`DROP TYPE "public"."ExperianReportStatusEnum"`);
    }

}
