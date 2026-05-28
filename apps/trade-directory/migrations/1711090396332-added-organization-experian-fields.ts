import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedOrganizationExperianFields1711090396332 implements MigrationInterface {
    name = 'AddedOrganizationExperianFields1711090396332'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization" ADD "experianBusinessSector" character varying`);
        await queryRunner.query(`ALTER TABLE "organization" ADD "experianNatureOfBusiness" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "experianNatureOfBusiness"`);
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "experianBusinessSector"`);
    }

}
