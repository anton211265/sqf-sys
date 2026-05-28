import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTransactionTable1711551366642 implements MigrationInterface {
    name = 'AddTransactionTable1711551366642'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "transaction" ("id" SERIAL NOT NULL, "date" TIMESTAMP, "ref" character varying, "description1" character varying, "description2" character varying, "debit" numeric, "credit" numeric, "balance" numeric, "parameter" character varying, "facility" character varying, "details" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp without time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp without time zone, "firstPartyAsClientPersonaId" integer, "secondPartyAsClientPersonaId" integer, "firstPartyAsContractAwarderPersonaId" integer, "secondPartyAsContractAwarderPersonaId" integer, "firstPartyAsSupplierPersonaId" integer, "secondPartyAsSupplierPersonaId" integer, CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "experian" ADD "businessConstitution" character varying`);
        await queryRunner.query(`ALTER TABLE "experian" ADD "principalActivity" character varying`);
        await queryRunner.query(`ALTER TABLE "experian" ADD "organizationId" integer`);
        await queryRunner.query(`ALTER TYPE "public"."ExperianReportTypeEnum" RENAME TO "ExperianReportTypeEnum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."ExperianReportTypeEnum" AS ENUM('COMPANY_INTELLIGENCE', 'ENHANCED_COMPANY_INTELLIGENCE', 'BUSINESS_INTELLIGENCE', 'ENHANCED_BUSINESS_INTELLIGENCE')`);
        await queryRunner.query(`ALTER TABLE "experian" ALTER COLUMN "reportType" TYPE "public"."ExperianReportTypeEnum" USING "reportType"::"text"::"public"."ExperianReportTypeEnum"`);
        await queryRunner.query(`DROP TYPE "public"."ExperianReportTypeEnum_old"`);
        await queryRunner.query(`ALTER TABLE "experian" DROP COLUMN "registeredAddress"`);
        await queryRunner.query(`ALTER TABLE "experian" ADD "registeredAddress" jsonb`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_0f5c9b27dacd8e38a71481426d2" FOREIGN KEY ("firstPartyAsClientPersonaId") REFERENCES "client_persona"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_abbab39096ae75f994c2957f206" FOREIGN KEY ("secondPartyAsClientPersonaId") REFERENCES "client_persona"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_078661ed8b2fd80bbbf87699fd1" FOREIGN KEY ("firstPartyAsContractAwarderPersonaId") REFERENCES "contract_awarder_persona"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_b7b3e0ffc6cca00621ce5def639" FOREIGN KEY ("secondPartyAsContractAwarderPersonaId") REFERENCES "contract_awarder_persona"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_289d6e1bcbdf080e317ef47592d" FOREIGN KEY ("firstPartyAsSupplierPersonaId") REFERENCES "supplier_persona"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_3b03405663bdf50a2ce0ff3aadd" FOREIGN KEY ("secondPartyAsSupplierPersonaId") REFERENCES "supplier_persona"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "experian" ADD CONSTRAINT "FK_9ae77462e414f94115c33869a59" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "experian" DROP CONSTRAINT "FK_9ae77462e414f94115c33869a59"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_3b03405663bdf50a2ce0ff3aadd"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_289d6e1bcbdf080e317ef47592d"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_b7b3e0ffc6cca00621ce5def639"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_078661ed8b2fd80bbbf87699fd1"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_abbab39096ae75f994c2957f206"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_0f5c9b27dacd8e38a71481426d2"`);
        await queryRunner.query(`ALTER TABLE "experian" DROP COLUMN "registeredAddress"`);
        await queryRunner.query(`ALTER TABLE "experian" ADD "registeredAddress" character varying`);
        await queryRunner.query(`CREATE TYPE "public"."ExperianReportTypeEnum_old" AS ENUM('COMPANY_INTELLIGENCE')`);
        await queryRunner.query(`ALTER TABLE "experian" ALTER COLUMN "reportType" TYPE "public"."ExperianReportTypeEnum_old" USING "reportType"::"text"::"public"."ExperianReportTypeEnum_old"`);
        await queryRunner.query(`DROP TYPE "public"."ExperianReportTypeEnum"`);
        await queryRunner.query(`ALTER TYPE "public"."ExperianReportTypeEnum_old" RENAME TO "ExperianReportTypeEnum"`);
        await queryRunner.query(`ALTER TABLE "experian" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "experian" DROP COLUMN "principalActivity"`);
        await queryRunner.query(`ALTER TABLE "experian" DROP COLUMN "businessConstitution"`);
        await queryRunner.query(`DROP TABLE "transaction"`);
    }

}
