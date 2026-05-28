import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrganizationPersonRoleEnum1710845112375 implements MigrationInterface {
    name = 'AddOrganizationPersonRoleEnum1710845112375'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."OrganizationPersonRoleEnum" RENAME TO "OrganizationPersonRoleEnum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."OrganizationPersonRoleEnum" AS ENUM('SUPERUSER', 'CEO', 'COO', 'CLIENT_COVERAGE', 'CUSTOMER_SUCCESS', 'CORPORATE_COMMUNICATIONS')`);
        await queryRunner.query(`ALTER TABLE "organization_person_role" ALTER COLUMN "role" TYPE "public"."OrganizationPersonRoleEnum" USING "role"::"text"::"public"."OrganizationPersonRoleEnum"`);
        await queryRunner.query(`DROP TYPE "public"."OrganizationPersonRoleEnum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."OrganizationPersonRoleEnum_old" AS ENUM('RELATIONSHIP_MANAGER')`);
        await queryRunner.query(`ALTER TABLE "organization_person_role" ALTER COLUMN "role" TYPE "public"."OrganizationPersonRoleEnum_old" USING "role"::"text"::"public"."OrganizationPersonRoleEnum_old"`);
        await queryRunner.query(`DROP TYPE "public"."OrganizationPersonRoleEnum"`);
        await queryRunner.query(`ALTER TYPE "public"."OrganizationPersonRoleEnum_old" RENAME TO "OrganizationPersonRoleEnum"`);
    }

}
