import { MigrationInterface, QueryRunner } from "typeorm";

export class NullableClientAwarderContract1716133295437 implements MigrationInterface {
    name = 'NullableClientAwarderContract1716133295437'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "client_awarder_contract" ALTER COLUMN "contractTitle" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client_awarder_contract" ALTER COLUMN "contractNumber" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client_awarder_contract" ALTER COLUMN "contractType" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client_awarder_contract" ALTER COLUMN "contractNature" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client_awarder_contract" ALTER COLUMN "assignmentMethod" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client_awarder_contract" ALTER COLUMN "fundingChannel" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client_awarder_contract" ALTER COLUMN "collectionMethod" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client_awarder_contract" ALTER COLUMN "contractStartDate" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client_awarder_contract" ALTER COLUMN "contractEndDate" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client_awarder_contract" ALTER COLUMN "contractSigningDate" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client_awarder_contract" ALTER COLUMN "totalContractValue" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client_awarder_contract" ALTER COLUMN "totalContractValueClaimed" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "client_awarder_contract" ALTER COLUMN "totalContractValueClaimed" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client_awarder_contract" ALTER COLUMN "totalContractValue" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client_awarder_contract" ALTER COLUMN "contractSigningDate" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client_awarder_contract" ALTER COLUMN "contractEndDate" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client_awarder_contract" ALTER COLUMN "contractStartDate" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client_awarder_contract" ALTER COLUMN "collectionMethod" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client_awarder_contract" ALTER COLUMN "fundingChannel" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client_awarder_contract" ALTER COLUMN "assignmentMethod" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client_awarder_contract" ALTER COLUMN "contractNature" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client_awarder_contract" ALTER COLUMN "contractType" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client_awarder_contract" ALTER COLUMN "contractNumber" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client_awarder_contract" ALTER COLUMN "contractTitle" SET NOT NULL`);
    }

}
