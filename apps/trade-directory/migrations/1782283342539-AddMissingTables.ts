import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingTables1782283342539 implements MigrationInterface {
    name = 'AddMissingTables1782283342539'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "token" DROP CONSTRAINT "token_personId_fkey"`);
        await queryRunner.query(`CREATE TABLE "reset_password_token" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "token" character varying NOT NULL, "tokenExpirationAt" TIMESTAMP NOT NULL, CONSTRAINT "UQ_609174ec22ebfd1b8dd71f867a3" UNIQUE ("token"), CONSTRAINT "PK_c6f6eb8f5c88ac0233eceb8d385" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TYPE "public"."OrganizationPersonRoleEnum" RENAME TO "OrganizationPersonRoleEnum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."OrganizationPersonRoleEnum" AS ENUM('SQFSYS', 'SUPERUSER', 'CEO', 'COO', 'CLIENT_COVERAGE', 'CUSTOMER_SUCCESS', 'CORPORATE_COMMUNICATIONS', 'CRM', 'RISK_ANALYST', 'FINANCE', 'SUPERVISOR_APPROVAL', 'MANAGER_APPROVAL')`);
        await queryRunner.query(`ALTER TABLE "organization_person_role" ALTER COLUMN "role" TYPE "public"."OrganizationPersonRoleEnum" USING "role"::"text"::"public"."OrganizationPersonRoleEnum"`);
        await queryRunner.query(`DROP TYPE "public"."OrganizationPersonRoleEnum_old"`);
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "organizationBusinessSector"`);
        await queryRunner.query(`CREATE TYPE "public"."BusinessSectorEnum" AS ENUM('AGRICULTURE_AND_FORESTRY', 'AUTOMOTIVE', 'BANKING_AND_FINANCIAL_SERVICES', 'BIOTECHNOLOGY', 'CHEMICALS', 'CONSTRUCTION_AND_REAL_ESTATE', 'CONSUMER_GOODS', 'EDUCATION_AND_TRAINING', 'ENERGY', 'ENTERTAINMENT_AND_MEDIA', 'ENVIRONMENTAL_SERVICES', 'FASHION_AND_APPAREL', 'FOOD_AND_BEVERAGE', 'HEALTHCARE_AND_PHARMACEUTICALS', 'HOSPITALITY_AND_TRAVEL', 'INFORMATION_TECHNOLOGY', 'INSURANCE', 'LEGAL_SERVICES', 'LOGISTICS_AND_TRANSPORTATION', 'MANUFACTURING', 'MARKETING_AND_ADVERTISING', 'MINING_AND_METALS', 'NON_PROFIT_AND_NGOS', 'PUBLIC_SECTOR_AND_GOVERNMENT', 'RETAIL_AND_WHOLESALE', 'TELECOMMUNICATIONS', 'TEXTILES', 'UTILITIES', 'WHOLESALE_TRADE', 'OTHERS')`);
        await queryRunner.query(`ALTER TABLE "organization" ADD "organizationBusinessSector" "public"."BusinessSectorEnum"`);
        await queryRunner.query(`ALTER TABLE "person" ADD CONSTRAINT "UQ_d2d717efd90709ebd3cb26b936c" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "token" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp without time zone`);
        await queryRunner.query(`ALTER TABLE "token" ALTER COLUMN "updatedAt" SET DEFAULT ('now'::text)::timestamp without time zone`);
        await queryRunner.query(`ALTER TABLE "token" ADD CONSTRAINT "FK_57ae7065218421ed7a9c57c1d6d" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "token" DROP CONSTRAINT "FK_57ae7065218421ed7a9c57c1d6d"`);
        await queryRunner.query(`ALTER TABLE "token" ALTER COLUMN "updatedAt" SET DEFAULT LOCALTIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "token" ALTER COLUMN "createdAt" SET DEFAULT LOCALTIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "person" DROP CONSTRAINT "UQ_d2d717efd90709ebd3cb26b936c"`);
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "organizationBusinessSector"`);
        await queryRunner.query(`DROP TYPE "public"."BusinessSectorEnum"`);
        await queryRunner.query(`ALTER TABLE "organization" ADD "organizationBusinessSector" character varying`);
        await queryRunner.query(`CREATE TYPE "public"."OrganizationPersonRoleEnum_old" AS ENUM('SUPERUSER', 'CEO', 'COO', 'CLIENT_COVERAGE', 'CUSTOMER_SUCCESS', 'CORPORATE_COMMUNICATIONS', 'CRM', 'RISK_ANALYST', 'FINANCE', 'SUPERVISOR_APPROVAL', 'MANAGER_APPROVAL')`);
        await queryRunner.query(`ALTER TABLE "organization_person_role" ALTER COLUMN "role" TYPE "public"."OrganizationPersonRoleEnum_old" USING "role"::"text"::"public"."OrganizationPersonRoleEnum_old"`);
        await queryRunner.query(`DROP TYPE "public"."OrganizationPersonRoleEnum"`);
        await queryRunner.query(`ALTER TYPE "public"."OrganizationPersonRoleEnum_old" RENAME TO "OrganizationPersonRoleEnum"`);
        await queryRunner.query(`DROP TABLE "reset_password_token"`);
        await queryRunner.query(`ALTER TABLE "token" ADD CONSTRAINT "token_personId_fkey" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
