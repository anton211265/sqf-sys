import { MigrationInterface, QueryRunner } from 'typeorm';

// New S3-backed table for organization-level artefacts (registration certs,
// tax certs, audited financials, ...). Added 2026-07-14. Bank account details
// are deliberately NOT part of this table — see CLAUDE.md "Bank account data
// belongs to the Payment service".
export class AddOrganizationDocument1784001800001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."OrganizationDocumentTypeEnum" AS ENUM(
        'BUSINESS_REGISTRATION_CERTIFICATE',
        'TAX_REGISTRATION_CERTIFICATE',
        'AUDITED_FINANCIAL_STATEMENT',
        'BANK_STATEMENT',
        'COMPANY_PROFILE',
        'OTHER'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "organization_document" (
        "id" SERIAL NOT NULL,
        "organizationId" integer NOT NULL,
        "documentType" "public"."OrganizationDocumentTypeEnum" NOT NULL,
        "bucketName" character varying NOT NULL,
        "objectKey" character varying NOT NULL,
        "fileName" character varying NOT NULL,
        "mimeType" character varying,
        "fileSizeBytes" integer,
        "uploadedByPersonId" integer,
        "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP,
        "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP,
        CONSTRAINT "PK_organization_document" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_organization_document_organizationId" ON "organization_document" ("organizationId")
    `);
    await queryRunner.query(`
      ALTER TABLE "organization_document"
      ADD CONSTRAINT "FK_organization_document_organization"
      FOREIGN KEY ("organizationId") REFERENCES "organization"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "organization_document"
      ADD CONSTRAINT "FK_organization_document_uploadedByPerson"
      FOREIGN KEY ("uploadedByPersonId") REFERENCES "person"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "organization_document" DROP CONSTRAINT "FK_organization_document_uploadedByPerson"
    `);
    await queryRunner.query(`
      ALTER TABLE "organization_document" DROP CONSTRAINT "FK_organization_document_organization"
    `);
    await queryRunner.query(`DROP TABLE "organization_document"`);
    await queryRunner.query(`DROP TYPE "public"."OrganizationDocumentTypeEnum"`);
  }
}
