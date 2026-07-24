import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * CRC domain permission keys — pass 1 (2026-07-24), minted from the
 * signed-off phase-2 annotation (docs/design/crc-sitemap-annotation.md).
 * Add-only per the dictionary rule. Model authoring reuses the existing
 * risk_models_view/risk_models_edit keys; these four add the checker and
 * publisher halves of maker-checker plus the assessment surface. Deferred
 * keys (risk_kyc_reports_request, risk_credit_limits_assign/approve,
 * recommendation chain) are minted with their own passes.
 */
export class CrcDomainPermissions1785500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permission" ("permKey", "permCategory", "permDescription") VALUES
      ('risk_models_check',        'Credit Risk', 'Verify a submitted Filter-2 risk model as the checker (cannot be the maker)'),
      ('risk_models_publish',      'Credit Risk', 'Approve and publish a checked Filter-2 risk model (Compliance Manager)'),
      ('risk_assessments_view',    'Credit Risk', 'View Filter-2 risk assessment results and history per client'),
      ('risk_assessments_conduct', 'Credit Risk', 'Run a client through a published Filter-2 risk model (qualitative survey)')
      ON CONFLICT ("permKey") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "permission" WHERE "permKey" IN (
        'risk_models_check', 'risk_models_publish',
        'risk_assessments_view', 'risk_assessments_conduct'
      )
    `);
  }
}
