import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Billing & Fee Execution Engine, Global Clearing Calendar and Governance
 * Policies (2026-07-24) — the remaining Funder Administration Portal
 * backends from the approved annotation (keys config_billing_*,
 * config_calendar_*, config_policies_view, config_sla_manage,
 * config_approval_matrix_manage, config_credit_ranges_manage,
 * config_policies_manage). All tables are per-funder config; nothing is
 * seeded (narrow-initialization ruling — each funder's Super Admin
 * configures from zero). funder_config_settings is a per-funder singleton
 * whose slices are guarded by different keys (day-count/penalty = billing,
 * roll-over = calendar, bank-match/email = policies).
 */
export class BillingCalendarPolicies1785100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "base_rate_index" (
        "id" SERIAL PRIMARY KEY,
        "funderOrganizationId" integer NOT NULL,
        "indexCode" varchar(20) NOT NULL,
        "ratePct" numeric(5,4) NOT NULL,
        "updateMode" varchar NOT NULL DEFAULT 'MANUAL',
        "createdAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP,
        "updatedAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP,
        CONSTRAINT "UQ_rate_index_funder_code" UNIQUE ("funderOrganizationId", "indexCode")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "fee_schedule" (
        "id" SERIAL PRIMARY KEY,
        "funderOrganizationId" integer NOT NULL,
        "feeCode" varchar(40) NOT NULL,
        "feeName" varchar(150) NOT NULL,
        "amount" numeric(15,2) NOT NULL,
        "chargeBasis" varchar NOT NULL DEFAULT 'TRANSACTION',
        "deductionRule" varchar NOT NULL DEFAULT 'AT_DISBURSEMENT',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP,
        "updatedAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP,
        CONSTRAINT "UQ_fee_funder_code" UNIQUE ("funderOrganizationId", "feeCode")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "calendar_day" (
        "id" SERIAL PRIMARY KEY,
        "funderOrganizationId" integer NOT NULL,
        "region" varchar(30) NOT NULL,
        "dayDate" date NOT NULL,
        "dayType" varchar NOT NULL DEFAULT 'HOLIDAY',
        "description" varchar(150),
        "cutoffTime" varchar(5),
        "createdAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP,
        CONSTRAINT "UQ_calendar_funder_region_date" UNIQUE ("funderOrganizationId", "region", "dayDate")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "sla_template" (
        "id" SERIAL PRIMARY KEY,
        "funderOrganizationId" integer NOT NULL,
        "slaCode" varchar(60) NOT NULL,
        "slaName" varchar(150) NOT NULL,
        "windowValue" integer NOT NULL,
        "windowUnit" varchar NOT NULL DEFAULT 'WORKING_DAYS',
        "breachAction" varchar(200) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP,
        "updatedAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP,
        CONSTRAINT "UQ_sla_funder_code" UNIQUE ("funderOrganizationId", "slaCode")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "approval_matrix_rule" (
        "id" SERIAL PRIMARY KEY,
        "funderOrganizationId" integer NOT NULL,
        "scope" varchar(60) NOT NULL,
        "thresholdAmount" numeric(15,2),
        "requiredApprovals" integer NOT NULL DEFAULT 1,
        "mode" varchar NOT NULL DEFAULT 'SEQUENTIAL',
        "description" varchar(200),
        "createdAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP,
        "updatedAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "credit_limit_range" (
        "id" SERIAL PRIMARY KEY,
        "funderOrganizationId" integer NOT NULL,
        "productCode" varchar(10) NOT NULL,
        "riskBand" varchar NOT NULL,
        "minLimit" numeric(15,2) NOT NULL,
        "maxLimit" numeric(15,2) NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP,
        "updatedAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP,
        CONSTRAINT "UQ_range_funder_product_band" UNIQUE ("funderOrganizationId", "productCode", "riskBand")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "funder_config_settings" (
        "id" SERIAL PRIMARY KEY,
        "funderOrganizationId" integer NOT NULL UNIQUE,
        "dayCountConvention" varchar NOT NULL DEFAULT 'ACT_365',
        "penaltyMarginPct" numeric(5,4) NOT NULL DEFAULT 0,
        "rolloverRule" varchar NOT NULL DEFAULT 'MODIFIED_FOLLOWING',
        "bankCountryMatchMode" varchar NOT NULL DEFAULT 'HARD_BLOCK',
        "corporateEmailMode" varchar NOT NULL DEFAULT 'BLOCK',
        "updatedAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "funder_config_settings"`);
    await queryRunner.query(`DROP TABLE "credit_limit_range"`);
    await queryRunner.query(`DROP TABLE "approval_matrix_rule"`);
    await queryRunner.query(`DROP TABLE "sla_template"`);
    await queryRunner.query(`DROP TABLE "calendar_day"`);
    await queryRunner.query(`DROP TABLE "fee_schedule"`);
    await queryRunner.query(`DROP TABLE "base_rate_index"`);
  }
}
