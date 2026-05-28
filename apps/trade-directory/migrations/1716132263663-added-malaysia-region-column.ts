import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedMalaysiaRegionColumn1716132263663 implements MigrationInterface {
    name = 'AddedMalaysiaRegionColumn1716132263663'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."OrganizationMalaysiaRegionEnum" AS ENUM('EAST_MALAYSIA', 'WEST_MALAYSIA', 'OTHER')`);
        await queryRunner.query(`ALTER TABLE "organization" ADD "malaysiaRegion" "public"."OrganizationMalaysiaRegionEnum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "malaysiaRegion"`);
        await queryRunner.query(`DROP TYPE "public"."OrganizationMalaysiaRegionEnum"`);
    }

}
