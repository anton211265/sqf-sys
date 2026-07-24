import { MigrationInterface, QueryRunner } from 'typeorm';

/** Customer Portal pass 2: My Clients activation — CLIENT_ONBOARDED marks
 * the projection row (registration fee confirmed, Applicant -> Client). */
export class ClientOnboarded1785900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "applicant_intake" ADD COLUMN IF NOT EXISTS "clientOnboardedAt" timestamp`,
    );
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "applicant_intake" DROP COLUMN IF EXISTS "clientOnboardedAt"`,
    );
  }
}
