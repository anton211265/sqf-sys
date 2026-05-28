import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrganizationPersonRelationId1712560039768 implements MigrationInterface {
    name = 'AddOrganizationPersonRelationId1712560039768'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization_person" DROP CONSTRAINT "FK_52119a73304c90a220f1f609f27"`);
        await queryRunner.query(`ALTER TABLE "organization_person" DROP CONSTRAINT "FK_fe6d15893551339be24e742674c"`);
        await queryRunner.query(`ALTER TABLE "organization_person" ALTER COLUMN "organizationId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "organization_person" ALTER COLUMN "personId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "organization_person" ADD CONSTRAINT "FK_52119a73304c90a220f1f609f27" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_person" ADD CONSTRAINT "FK_fe6d15893551339be24e742674c" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization_person" DROP CONSTRAINT "FK_fe6d15893551339be24e742674c"`);
        await queryRunner.query(`ALTER TABLE "organization_person" DROP CONSTRAINT "FK_52119a73304c90a220f1f609f27"`);
        await queryRunner.query(`ALTER TABLE "organization_person" ALTER COLUMN "personId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "organization_person" ALTER COLUMN "organizationId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "organization_person" ADD CONSTRAINT "FK_fe6d15893551339be24e742674c" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_person" ADD CONSTRAINT "FK_52119a73304c90a220f1f609f27" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
