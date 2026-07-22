import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Dynamic RBAC (2026-07-22): runtime-editable roles composed from a
 * code-owned permission dictionary. Extends the existing (empty)
 * organization_role table with tenant scoping + immutability instead of
 * creating a parallel roles table; person/organization_person remain the
 * user registry. The permission dictionary rows below are the platform's
 * capability registry — seeded here because they ship with the code, unlike
 * roles/assignments which each Funder's Super Admin configures from zero.
 */
export class DynamicRbac1784700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "organization_role"
        ADD COLUMN IF NOT EXISTS "organizationId" integer
          REFERENCES "organization"("id") ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS "isImmutable" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "organization_role"
        ADD CONSTRAINT "UQ_organization_role_org_name" UNIQUE ("organizationId", "name")
    `);

    await queryRunner.query(`
      CREATE TABLE "permission" (
        "id" SERIAL NOT NULL,
        "permKey" character varying NOT NULL,
        "permCategory" character varying NOT NULL,
        "permDescription" character varying NOT NULL,
        "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP,
        CONSTRAINT "PK_permission" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_permission_permKey" UNIQUE ("permKey")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "role_permission" (
        "id" SERIAL NOT NULL,
        "roleId" integer NOT NULL REFERENCES "organization_role"("id") ON DELETE CASCADE,
        "permissionId" integer NOT NULL REFERENCES "permission"("id") ON DELETE CASCADE,
        "grantedByPersonId" integer,
        "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP,
        CONSTRAINT "PK_role_permission" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_role_permission_pair" UNIQUE ("roleId", "permissionId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_role_permission_roleId" ON "role_permission" ("roleId")`,
    );

    await queryRunner.query(`
      CREATE TABLE "person_role" (
        "id" SERIAL NOT NULL,
        "personId" integer NOT NULL REFERENCES "person"("id") ON DELETE CASCADE,
        "roleId" integer NOT NULL REFERENCES "organization_role"("id") ON DELETE CASCADE,
        "assignedByPersonId" integer,
        "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP,
        CONSTRAINT "PK_person_role" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_person_role_pair" UNIQUE ("personId", "roleId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_person_role_personId" ON "person_role" ("personId")`,
    );

    await queryRunner.query(`
      CREATE TABLE "rbac_audit_log" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "event" character varying NOT NULL,
        "executedByPersonId" integer,
        "organizationId" integer,
        "targetType" character varying,
        "targetId" integer,
        "metadataPayload" jsonb,
        "ipAddress" character varying,
        "userAgent" character varying,
        "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP,
        CONSTRAINT "PK_rbac_audit_log" PRIMARY KEY ("id")
      )
    `);

    // Permission dictionary — keys are what code references; never rename a
    // key in place (add a new one and migrate roles) or hasPermission checks
    // silently break.
    await queryRunner.query(`
      INSERT INTO "permission" ("permKey", "permCategory", "permDescription") VALUES
      ('risk_applications_view',        'Credit Risk', 'View the loan application queue and application details'),
      ('risk_applications_assess',      'Credit Risk', 'Run and record risk assessments on applications'),
      ('risk_models_view',              'Credit Risk', 'View risk models'),
      ('risk_models_edit',              'Credit Risk', 'Create and edit risk models'),
      ('risk_profiles_view',            'Credit Risk', 'View risk profiles'),
      ('risk_profiles_edit',            'Credit Risk', 'Create and edit risk profiles'),
      ('risk_kyc_reports_view',         'Credit Risk', 'View KYC agency reports'),
      ('risk_org_kyc_resolve',          'Credit Risk', 'Confirm or override AI organization-KYC recommendations'),
      ('onboarding_applicants_view',    'Client Onboarding & Relationship Management', 'View the applicant list'),
      ('onboarding_applications_manage','Client Onboarding & Relationship Management', 'Create and progress client applications'),
      ('onboarding_clients_view',       'Client Onboarding & Relationship Management', 'View the client list'),
      ('onboarding_site_visits_manage', 'Client Onboarding & Relationship Management', 'Record and manage site visit reports'),
      ('crm_assignees_view',            'Customer Relationship Management', 'View client assignees'),
      ('crm_assignees_manage',          'Customer Relationship Management', 'Create and manage client assignees'),
      ('directory_organizations_view',  'Trade Directory', 'View organizations in the trade directory'),
      ('directory_organizations_manage','Trade Directory', 'Create and edit trade directory organizations'),
      ('directory_relationships_manage','Trade Directory', 'Create and manage trade relationships'),
      ('directory_contracts_manage',    'Trade Directory', 'Create and manage contracts'),
      ('directory_invoices_view',       'Trade Directory', 'View invoices'),
      ('directory_invoices_create',     'Trade Directory', 'Create invoices'),
      ('directory_invoices_status_manage','Trade Directory', 'Move invoices through the status machine'),
      ('directory_subscriptions_manage','Trade Directory', 'Manage lending product subscriptions'),
      ('documents_view',                'Document Management', 'View documents and extraction results'),
      ('documents_upload',              'Document Management', 'Upload documents'),
      ('documents_search',              'Document Management', 'Search current and archived documents'),
      ('documents_archive',             'Document Management', 'Archive documents'),
      ('documents_discrepancies_clear', 'Document Management', 'Clear cross-validation discrepancies (Risk Officer)'),
      ('documents_invoices_reconcile',  'Document Management', 'Reconcile invoices that failed the arithmetic gate (Finance Analyst)'),
      ('opportunities_view',            'Knowledge Graph', 'View saved GraphRAG opportunity queries'),
      ('opportunities_query',           'Knowledge Graph', 'Run ad-hoc natural-language opportunity queries'),
      ('admin_roles_manage',            'Configuration & Administration', 'Create, edit and delete roles and their permission sets'),
      ('admin_users_view',              'Configuration & Administration', 'View the user directory and role assignments'),
      ('admin_users_assign_roles',      'Configuration & Administration', 'Assign and remove user roles'),
      ('admin_enrollment_tokens_issue', 'Configuration & Administration', 'Issue passkey enrollment links'),
      ('admin_sessions_terminate',      'Configuration & Administration', 'Force-terminate a user''s active sessions'),
      ('admin_audit_view',              'Configuration & Administration', 'View security and RBAC audit ledgers'),
      ('finance_payments_view',         'Finance', 'View transactions and payment processing (future Payment service)'),
      ('finance_payments_approve',      'Finance', 'Approve payment instructions (future Payment service)'),
      ('compliance_checks_view',        'Compliance', 'View compliance checks (future Compliance domain)'),
      ('compliance_audit_view',         'Compliance', 'View compliance audit logs (future Compliance domain)')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "rbac_audit_log"`);
    await queryRunner.query(`DROP TABLE "person_role"`);
    await queryRunner.query(`DROP TABLE "role_permission"`);
    await queryRunner.query(`DROP TABLE "permission"`);
    await queryRunner.query(
      `ALTER TABLE "organization_role" DROP CONSTRAINT "UQ_organization_role_org_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_role" DROP COLUMN "isImmutable", DROP COLUMN "organizationId"`,
    );
  }
}
