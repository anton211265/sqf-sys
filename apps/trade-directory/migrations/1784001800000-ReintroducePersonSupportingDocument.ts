import { MigrationInterface, QueryRunner } from 'typeorm';

// person_supporting_document existed in the original 2024 schema (NRIC scan
// -> S3 bucketKey) but was dropped during the 2026-07-13 trade-directory
// redesign. Reintroduced 2026-07-14. Note: the "PersonSupportingDocumentTypeEnum"
// Postgres type from the original migration was never dropped, so it is
// reused here rather than re-created.
export class ReintroducePersonSupportingDocument1784001800000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "person_supporting_document" (
        "id" SERIAL NOT NULL,
        "personId" integer NOT NULL,
        "bucketKey" character varying NOT NULL,
        "supportingDocumentType" "public"."PersonSupportingDocumentTypeEnum" NOT NULL,
        "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP,
        "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP,
        CONSTRAINT "PK_person_supporting_document" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_person_supporting_document_personId" ON "person_supporting_document" ("personId")
    `);
    await queryRunner.query(`
      ALTER TABLE "person_supporting_document"
      ADD CONSTRAINT "FK_person_supporting_document_person"
      FOREIGN KEY ("personId") REFERENCES "person"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "person_supporting_document" DROP CONSTRAINT "FK_person_supporting_document_person"
    `);
    await queryRunner.query(`DROP TABLE "person_supporting_document"`);
  }
}
