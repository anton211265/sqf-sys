import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddedExtraOnboardingColumns1727843179388
  implements MigrationInterface
{
  name = 'AddedExtraOnboardingColumns1727843179388';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "yearEstablished" character varying(4)`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "revenueCurrency" "public"."CurrencyCodeEnum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "revenueAmount" numeric(15,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "emailAddress" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "contactNumber" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "postcode" character varying`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."OrganizationCompanySizeEnum" AS ENUM('1-10', '11-50', '51-100', '101-250', '251-500', '501-1000', '1001+')`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "companySize" "public"."OrganizationCompanySizeEnum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "companySize"`,
    );
    await queryRunner.query(`DROP TYPE "public"."OrganizationCompanySizeEnum"`);
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "postcode"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "contactNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "emailAddress"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "revenueAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "revenueCurrency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "yearEstablished"`,
    );
  }
}
