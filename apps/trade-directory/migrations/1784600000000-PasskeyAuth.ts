import { MigrationInterface, QueryRunner } from 'typeorm';

export class PasskeyAuth1784600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "webauthn_credential" (
        "id" SERIAL NOT NULL,
        "personId" integer NOT NULL,
        "credentialId" character varying NOT NULL,
        "publicKey" text NOT NULL,
        "counter" bigint NOT NULL DEFAULT 0,
        "transports" character varying,
        "deviceType" character varying,
        "backedUp" boolean NOT NULL DEFAULT false,
        "label" character varying,
        "lastUsedAt" TIMESTAMP WITHOUT TIME ZONE,
        "revokedAt" TIMESTAMP WITHOUT TIME ZONE,
        "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP,
        "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP,
        CONSTRAINT "PK_webauthn_credential" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_webauthn_credential_credentialId" UNIQUE ("credentialId"),
        CONSTRAINT "FK_webauthn_credential_person" FOREIGN KEY ("personId")
          REFERENCES "person"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_webauthn_credential_personId"
        ON "webauthn_credential" ("personId")
    `);
    await queryRunner.query(`
      CREATE TABLE "enrollment_token" (
        "id" SERIAL NOT NULL,
        "personId" integer NOT NULL,
        "tokenHash" character varying NOT NULL,
        "expiresAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        "usedAt" TIMESTAMP WITHOUT TIME ZONE,
        "createdByPersonId" integer,
        "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP,
        "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP,
        CONSTRAINT "PK_enrollment_token" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_enrollment_token_tokenHash" UNIQUE ("tokenHash"),
        CONSTRAINT "FK_enrollment_token_person" FOREIGN KEY ("personId")
          REFERENCES "person"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "enrollment_token"`);
    await queryRunner.query(`DROP TABLE "webauthn_credential"`);
  }
}
