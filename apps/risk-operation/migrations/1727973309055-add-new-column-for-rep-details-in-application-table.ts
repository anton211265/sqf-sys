import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewColumnForRepDetailsInApplicationTable1727973309055 implements MigrationInterface {
    name = 'AddNewColumnForRepDetailsInApplicationTable1727973309055'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application" ADD "shareholders" jsonb`);
        await queryRunner.query(`ALTER TABLE "application" ADD "guarantors" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application" DROP COLUMN "guarantors"`);
        await queryRunner.query(`ALTER TABLE "application" DROP COLUMN "shareholders"`);
    }

}
