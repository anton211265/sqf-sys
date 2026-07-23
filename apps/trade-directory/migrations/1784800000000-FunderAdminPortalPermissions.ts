import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Funder Administration Portal permission keys (2026-07-24), minted from the
 * signed-off phase-2 sitemap annotation
 * (docs/design/funder-admin-portal-sitemap-annotation.md — SQF Blueprint HLD).
 * Add-only per the dictionary rule: keys are never renamed in place.
 * Categories introduce three new Role Builder accordions: Product
 * Configuration, Billing & Calendar, Governance Policies.
 */
export class FunderAdminPortalPermissions1784800000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permission" ("permKey", "permCategory", "permDescription") VALUES
      ('admin_users_create',             'Configuration & Administration', 'Create user accounts and issue their first passkey enrollment link'),
      ('admin_audit_export',             'Configuration & Administration', 'Generate regulatory audit exports (encrypted CSV/PDF) for external auditors'),
      ('risk_profiles_approve',          'Credit Risk', 'Approve changes to the default risk profile (Risk Operations Manager)'),
      ('config_products_view',           'Product Configuration', 'View the product registry, rate cards and assignment engine'),
      ('config_products_manage',         'Product Configuration', 'Create, edit and activate/deactivate standard products'),
      ('config_products_bespoke_create', 'Product Configuration', 'Create client-restricted bespoke product configurations'),
      ('config_rate_cards_manage',       'Product Configuration', 'Draft and edit master rate card versions'),
      ('config_rate_cards_publish',      'Product Configuration', 'Publish/activate a master rate card version'),
      ('config_legal_templates_manage',  'Product Configuration', 'Upload legal document templates and bind them to products'),
      ('config_risk_filters_assign',     'Product Configuration', 'Assign a second-filter risk profile to a product'),
      ('config_billing_view',            'Billing & Calendar', 'View billing, fee and accrual configuration'),
      ('config_billing_manage',          'Billing & Calendar', 'Manage base rate indices, penalty rules, fee schedules and day-count conventions'),
      ('config_calendar_view',           'Billing & Calendar', 'View clearing calendars and settlement rules'),
      ('config_calendar_manage',         'Billing & Calendar', 'Manage holiday registries, roll-over rules and cut-off days'),
      ('config_policies_view',           'Governance Policies', 'View SLA templates, approval matrices and operational policies'),
      ('config_sla_manage',              'Governance Policies', 'Create and edit SLA timer templates'),
      ('config_approval_matrix_manage',  'Governance Policies', 'Configure executive approval matrices (quorum, thresholds)'),
      ('config_credit_ranges_manage',    'Governance Policies', 'Configure credit-limit assignment ranges by product and risk score'),
      ('config_policies_manage',         'Governance Policies', 'Manage operational policy toggles (bank-country match, email blocklist)')
      ON CONFLICT ("permKey") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "permission" WHERE "permKey" IN (
        'admin_users_create', 'admin_audit_export', 'risk_profiles_approve',
        'config_products_view', 'config_products_manage', 'config_products_bespoke_create',
        'config_rate_cards_manage', 'config_rate_cards_publish',
        'config_legal_templates_manage', 'config_risk_filters_assign',
        'config_billing_view', 'config_billing_manage',
        'config_calendar_view', 'config_calendar_manage',
        'config_policies_view', 'config_sla_manage',
        'config_approval_matrix_manage', 'config_credit_ranges_manage',
        'config_policies_manage'
      )
    `);
  }
}
