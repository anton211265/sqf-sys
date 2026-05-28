import { MigrationInterface, QueryRunner } from "typeorm";

export class FixOrganizationType1712051223541 implements MigrationInterface {
    name = 'FixOrganizationType1712051223541'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."OrganizationTypeEnum" RENAME TO "OrganizationTypeEnum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."OrganizationTypeEnum" AS ENUM('GOVERNMENT_EP', 'GOVERNMENT_NON_EP', 'GOVERNMENT_LINKED_COMPANY', 'MULTINATIONAL_CORPORATION', 'PUBLIC_LIMITED', 'PRIVATE_LIMITED', 'PARTNERSHIP', 'SOLE_PROPRIETORSHIP', 'COOPERATIVE', 'OTHERS')`);
        await queryRunner.query(`ALTER TABLE "organization" ALTER COLUMN "organizationType" TYPE "public"."OrganizationTypeEnum" USING "organizationType"::"text"::"public"."OrganizationTypeEnum"`);
        await queryRunner.query(`DROP TYPE "public"."OrganizationTypeEnum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."OrganizationTypeEnum_old" AS ENUM('GOVERNMENT_EP', 'GOVERNMENT_NON_EP', 'GOVERNMENT_LINKED_COMPANY', 'MULTI_NATIONAL_COMPANY', 'PRIVATE_COMPANY', 'OTHERS')`);
        await queryRunner.query(`ALTER TABLE "organization" ALTER COLUMN "organizationType" TYPE "public"."OrganizationTypeEnum_old" USING "organizationType"::"text"::"public"."OrganizationTypeEnum_old"`);
        await queryRunner.query(`DROP TYPE "public"."OrganizationTypeEnum"`);
        await queryRunner.query(`ALTER TYPE "public"."OrganizationTypeEnum_old" RENAME TO "OrganizationTypeEnum"`);
    }

}
