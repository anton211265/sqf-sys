import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * CRM domain permission keys (2026-07-24), minted from the signed-off
 * phase-2 annotation (docs/design/crm-sitemap-annotation.md). Add-only per
 * the dictionary rule. Supervisor assignment deliberately reuses the
 * existing crm_assignees_manage key; applicant/client/site-visit surfaces
 * reuse the onboarding_* keys.
 */
export class CrmDomainPermissions1784900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permission" ("permKey", "permCategory", "permDescription") VALUES
      ('crm_supervisor_view',   'Customer Relationship Management', 'View the supervisor dashboard: team pipeline, RM performance, unassigned queues'),
      ('crm_pipeline_view',     'Customer Relationship Management', 'View own leads, prospects and deal pipeline'),
      ('crm_leads_manage',      'Customer Relationship Management', 'Create, edit, qualify and close leads and prospects'),
      ('crm_deals_manage',      'Customer Relationship Management', 'Create and update deals and move them across pipeline stages'),
      ('crm_prospects_promote', 'Customer Relationship Management', 'Promote a prospect to applicant and initiate onboarding')
      ON CONFLICT ("permKey") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "permission" WHERE "permKey" IN (
        'crm_supervisor_view', 'crm_pipeline_view', 'crm_leads_manage',
        'crm_deals_manage', 'crm_prospects_promote'
      )
    `);
  }
}
