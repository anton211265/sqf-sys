import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewApplicationPersonTable1734630476555
  implements MigrationInterface
{
  name = 'AddNewApplicationPersonTable1734630476555';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "application_person" ("id" SERIAL NOT NULL, "organizationPersonId" integer NOT NULL, "applicationId" integer NOT NULL, "name" character varying(255) NOT NULL, "roles" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp without time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp without time zone, CONSTRAINT "PK_6b894394b2ff381bb7f6f95d09a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_person" ADD CONSTRAINT "FK_0678404a67d6a68b25531e012c4" FOREIGN KEY ("applicationId") REFERENCES "application"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "application_person" DROP CONSTRAINT "FK_0678404a67d6a68b25531e012c4"`,
    );
    await queryRunner.query(`DROP TABLE "application_person"`);
  }
}
