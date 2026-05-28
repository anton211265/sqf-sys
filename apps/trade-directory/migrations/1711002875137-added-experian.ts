import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedExperian1711002875137 implements MigrationInterface {
    name = 'AddedExperian1711002875137'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."ExperianReportTypeEnum" AS ENUM('COMPANY_INTELLIGENCE')`);
        await queryRunner.query(`CREATE TABLE "experian" ("id" SERIAL NOT NULL, "reportType" "public"."ExperianReportTypeEnum" NOT NULL, "registrationNumber" character varying, "companyName" character varying, "type" character varying, "incorporationDate" TIMESTAMP, "status" character varying, "businessAddress" character varying, "registeredAddress" character varying, "businessSector" character varying, "lastFinancialFiled" TIMESTAMP, "natureOfBusiness" character varying, "shareCapitalTotalIssued" numeric, "shareCapitalCash" numeric, "shareCapitalOtherwiseThanCash" numeric, "managementDetails" jsonb, "shareholders" jsonb, "companyCharges" jsonb, "interestInOtherCompanies" jsonb, "nonCurrentAssets" numeric, "currentAssets" numeric, "totalAssets" numeric, "accumulatedProfitCarriedForward" numeric, "totalEquity" numeric, "nonCurrentLiabilities" numeric, "currentLiabilities" numeric, "totalLiabilities" numeric, "totalEquityAndLiabilities" numeric, "revenue" numeric, "profitBeforeTax" numeric, "profitAfterTax" numeric, "currentRatio" numeric, "legalSuitsSubjectAsDefendant" jsonb, "legalSuitsSubjectAsPlaintiff" jsonb, "windingUpActionSubjectAsDefendant" jsonb, "windingUpActionSubjectAsPetitioner" jsonb, CONSTRAINT "PK_75f31c493d9213606f61fe76437" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "experian"`);
        await queryRunner.query(`DROP TYPE "public"."ExperianReportTypeEnum"`);
    }

}
