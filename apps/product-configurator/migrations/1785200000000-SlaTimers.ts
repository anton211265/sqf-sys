import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * SLA firing engine (2026-07-24): runtime timer instances for the
 * sla_template configuration. Timers are started/cancelled by business
 * flows (Kafka SLA_TIMER_START/CANCEL via the outbox pattern, or REST for
 * portal/dev use); a cron breaches overdue RUNNING timers and emits
 * SLA_BREACHED (+ SEND_EMAIL when the start payload carried notifyEmail).
 * processed_event is the house idempotency table — this service now
 * consumes Kafka for the first time. At most one RUNNING timer per
 * (funder, slaCode, subject) — enforced by a partial unique index.
 */
export class SlaTimers1785200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sla_timer" (
        "id" SERIAL PRIMARY KEY,
        "funderOrganizationId" integer NOT NULL,
        "slaTemplateId" integer NOT NULL REFERENCES "sla_template"("id") ON DELETE RESTRICT,
        "slaCode" varchar(60) NOT NULL,
        "subjectType" varchar(40) NOT NULL,
        "subjectId" varchar(60) NOT NULL,
        "region" varchar(30),
        "startedAt" timestamp NOT NULL,
        "deadlineAt" timestamp NOT NULL,
        "status" varchar NOT NULL DEFAULT 'RUNNING',
        "breachedAt" timestamp,
        "resolvedAt" timestamp,
        "resolveReason" varchar(200),
        "notifyEmail" varchar,
        "context" jsonb,
        "createdAt" timestamp NOT NULL DEFAULT LOCALTIMESTAMP
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_sla_timer_running_subject"
        ON "sla_timer" ("funderOrganizationId", "slaCode", "subjectType", "subjectId")
        WHERE "status" = 'RUNNING'
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_sla_timer_due" ON "sla_timer" ("status", "deadlineAt")`,
    );

    await queryRunner.query(`
      CREATE TABLE "processed_event" (
        "id" uuid PRIMARY KEY,
        "topic" varchar NOT NULL,
        "processed_at" timestamp NOT NULL DEFAULT LOCALTIMESTAMP
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "processed_event"`);
    await queryRunner.query(`DROP TABLE "sla_timer"`);
  }
}
