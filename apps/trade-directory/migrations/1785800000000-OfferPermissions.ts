import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Provisional Offer workspace keys (2026-07-24), approved in
 * docs/design/provisional-offer-design.md ruling 6. Add-only.
 */
export class OfferPermissions1785800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permission" ("permKey", "permCategory", "permDescription") VALUES
      ('risk_offers_view',    'Credit Risk', 'View the provisional offer queue and workspaces'),
      ('risk_offers_manage',  'Credit Risk', 'Create, simulate, edit and submit provisional offers (CRA maker)'),
      ('risk_offers_check',   'Credit Risk', 'Verify a submitted provisional offer as the second CRA (cannot be the maker)'),
      ('risk_offers_approve', 'Credit Risk', 'Approve or reject checked provisional offers (CRC Manager)'),
      ('risk_offers_resolve', 'Credit Risk', 'Refresh a lapsed offer or close and archive after the applicant outcome (RM)')
      ON CONFLICT ("permKey") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "permission" WHERE "permKey" IN (
        'risk_offers_view','risk_offers_manage','risk_offers_check',
        'risk_offers_approve','risk_offers_resolve'
      )
    `);
  }
}
