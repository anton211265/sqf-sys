import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Filter-2 risk profile → product assignment (annotation:
 * config_risk_filters_assign). riskProfileCode is a bare reference to a
 * risk-operation profile (house rule: no cross-DB FK; existence is
 * validated by the humans choosing from the risk-operation-fed dropdown,
 * and by the CO flow when it reads the assignment).
 */
export class RiskFilterAssignment1785300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "product_risk_filter_assignment" (
        "id" SERIAL PRIMARY KEY,
        "funderOrganizationId" integer NOT NULL,
        "productId" integer NOT NULL UNIQUE REFERENCES "product"("id") ON DELETE CASCADE,
        "riskProfileCode" varchar(80) NOT NULL,
        "updatedAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "product_risk_filter_assignment"`);
  }
}
