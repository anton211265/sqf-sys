import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewRelationshipToOrganizationRoleTable1734633407500 implements MigrationInterface {
    name = 'AddNewRelationshipToOrganizationRoleTable1734633407500'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization_person_role" ADD "roleId" integer`);
        await queryRunner.query(`ALTER TABLE "organization_person_role" ADD CONSTRAINT "FK_338aa65c69e6226969af21b2e6a" FOREIGN KEY ("roleId") REFERENCES "organization_role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization_person_role" DROP CONSTRAINT "FK_338aa65c69e6226969af21b2e6a"`);
        await queryRunner.query(`ALTER TABLE "organization_person_role" DROP COLUMN "roleId"`);
    }

}
