import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1716130841115 implements MigrationInterface {
  name = 'Initial1716130841115';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."ApplicationSupportingDocumentTypeEnum" AS ENUM('LETTER_OF_AWARD', 'PURCHASE_ORDER', 'CONTRACT', 'MISSING_PAGES', 'CASH_FLOW_APPENDED', 'APPENDIX_IN_CONTRACT', 'RELATED_COMPANY_NOTES', 'BANK_STATEMENT', 'FINANCIAL_STATEMENT', 'COMPANY_PROFILE', 'COMPANY_GROUP_STRUCTURE', 'ORGANIZATION_CHART', 'CREDIT_CONSENT_FORM', 'SITE_VISIT_REPORT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "application_supporting_document" ("id" SERIAL NOT NULL, "bucketKey" character varying NOT NULL, "supportingDocumentType" "public"."ApplicationSupportingDocumentTypeEnum" NOT NULL, "fileExtension" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp without time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp without time zone, "applicationId" integer, CONSTRAINT "PK_398120cab6042c8b82d38bed3bf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ClientAwarderContractTypeEnum" AS ENUM('SUPPLY', 'SERVICES', 'SUPPLY_AND_SERVICES', 'OTHERS')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ClientAwarderContractNatureEnum" AS ENUM('RECURRING', 'ONE_OFF', 'STAGGERED', 'MILESTONE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ClientAwarderContractAssignmentMethodEnum" AS ENUM('NOTICE_OF_ASSIGNMENT', 'ESCROW')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ClientAwarderContractFundingChannelEnum" AS ENUM('IN_HOUSE_FUNDING', 'MBSB', 'BANK_RAKYAT', 'RPS')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ClientAwarderContractCollectionMethodEnum" AS ENUM('EFT_ESCROW', 'EP_EFT', 'NON_EP_EFT', 'E_MANDATE', 'CHEQUE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."CurrencyCodeEnum" AS ENUM('USD', 'CAD', 'EUR', 'AED', 'AFN', 'ALL', 'AMD', 'ARS', 'AUD', 'AZN', 'BAM', 'BDT', 'BGN', 'BHD', 'BIF', 'BND', 'BOB', 'BRL', 'BWP', 'BYN', 'BZD', 'CDF', 'CHF', 'CLP', 'CNY', 'COP', 'CRC', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EEK', 'EGP', 'ERN', 'ETB', 'GBP', 'GEL', 'GHS', 'GNF', 'GTQ', 'HKD', 'HNL', 'HRK', 'HUF', 'IDR', 'ILS', 'INR', 'IQD', 'IRR', 'ISK', 'JMD', 'JOD', 'JPY', 'KES', 'KHR', 'KMF', 'KRW', 'KWD', 'KZT', 'LBP', 'LKR', 'LTL', 'LVL', 'LYD', 'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MOP', 'MUR', 'MXN', 'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR', 'PAB', 'PEN', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD', 'RUB', 'RWF', 'SAR', 'SDG', 'SEK', 'SGD', 'SOS', 'SYP', 'THB', 'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX', 'UYU', 'UZS', 'VEF', 'VND', 'XAF', 'XOF', 'YER', 'ZAR', 'ZMK', 'ZWL')`,
    );
    await queryRunner.query(
      `CREATE TABLE "client_awarder_contract" ("id" SERIAL NOT NULL, "contractTitle" character varying NOT NULL, "contractNumber" character varying NOT NULL, "contractType" "public"."ClientAwarderContractTypeEnum" NOT NULL, "contractTypeOther" character varying, "contractNature" "public"."ClientAwarderContractNatureEnum" NOT NULL, "contractStatus" character varying, "assignmentMethod" "public"."ClientAwarderContractAssignmentMethodEnum" NOT NULL, "fundingChannel" "public"."ClientAwarderContractFundingChannelEnum" NOT NULL, "collectionMethod" "public"."ClientAwarderContractCollectionMethodEnum" NOT NULL, "contractStartDate" TIMESTAMP NOT NULL, "contractEndDate" TIMESTAMP NOT NULL, "extensionOfTenure" TIMESTAMP, "contractSigningDate" TIMESTAMP NOT NULL, "totalContractValue" numeric NOT NULL, "totalContractValueClaimed" numeric NOT NULL, "totalContractValueCurrency" "public"."CurrencyCodeEnum" NOT NULL DEFAULT 'MYR', "variationOrders" jsonb, "remark" character varying, "clientPersonaId" integer NOT NULL, "clientOrganizationName" character varying NOT NULL, "contractAwarder" jsonb, "suppliers" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp without time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp without time zone, CONSTRAINT "PK_0fe4e78f980b212bb32eecd8702" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "application_public" ("id" SERIAL NOT NULL, "uuid" uuid NOT NULL, "expiryDateTime" TIMESTAMP NOT NULL, "applicationId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp without time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp without time zone, CONSTRAINT "PK_2e76404178edcdb5ef88b15ab4c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ApplicationStatusEnum" AS ENUM('DRAFT', 'PENDING_EXPERIAN_CONSENT', 'PENDING_EXPERIAN_REPORT', 'PENDING_CLIENT_SUBMISSION', 'PENDING_ASSIGNEE_REVIEW')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."LeadSourceEnum" AS ENUM('WEBSITE')`,
    );
    // await queryRunner.query(`CREATE TYPE "public"."CurrencyCodeEnum" AS ENUM('USD', 'CAD', 'EUR', 'AED', 'AFN', 'ALL', 'AMD', 'ARS', 'AUD', 'AZN', 'BAM', 'BDT', 'BGN', 'BHD', 'BIF', 'BND', 'BOB', 'BRL', 'BWP', 'BYN', 'BZD', 'CDF', 'CHF', 'CLP', 'CNY', 'COP', 'CRC', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EEK', 'EGP', 'ERN', 'ETB', 'GBP', 'GEL', 'GHS', 'GNF', 'GTQ', 'HKD', 'HNL', 'HRK', 'HUF', 'IDR', 'ILS', 'INR', 'IQD', 'IRR', 'ISK', 'JMD', 'JOD', 'JPY', 'KES', 'KHR', 'KMF', 'KRW', 'KWD', 'KZT', 'LBP', 'LKR', 'LTL', 'LVL', 'LYD', 'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MOP', 'MUR', 'MXN', 'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR', 'PAB', 'PEN', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD', 'RUB', 'RWF', 'SAR', 'SDG', 'SEK', 'SGD', 'SOS', 'SYP', 'THB', 'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX', 'UYU', 'UZS', 'VEF', 'VND', 'XAF', 'XOF', 'YER', 'ZAR', 'ZMK', 'ZWL')`);
    await queryRunner.query(
      `CREATE TABLE "application" ("id" SERIAL NOT NULL, "applicationDate" TIMESTAMP, "applicationStatus" "public"."ApplicationStatusEnum" NOT NULL DEFAULT 'DRAFT', "leadSource" "public"."LeadSourceEnum", "clientPersonaId" integer NOT NULL, "clientOrganizationName" character varying NOT NULL, "clientContactPersons" jsonb, "clientBankAccounts" jsonb, "clientPersonInCharge" jsonb, "directors" jsonb, "nextOfKins" jsonb, "corporateGuarantors" jsonb, "remark" character varying, "numberOfContractSecured" integer, "valueOfContractSecured" numeric, "valueOfContractSecuredCurrency" "public"."CurrencyCodeEnum" NOT NULL DEFAULT 'MYR', "applicationFee" numeric, "latePaymentCharges" numeric, "administrationFee" numeric, "processingFee" numeric, "remittanceCharges" numeric, "collectionFee" numeric, "eMandateFee" numeric, "facilityFee" numeric, "supportLetterCharges" numeric, "letterOfUndertakingCharges" numeric, "bankGuaranteeServiceFee" numeric, "letterOfCreditServiceFee" numeric, "customerRetention" numeric, "financialAdvisory" numeric, "retainerFee" numeric, "arrangerFee" numeric, "stampingFee" numeric, "sinkingFund" numeric, "approvalFee" numeric, "factorPersonaId" integer NOT NULL, "creatorPersonId" integer NOT NULL, "assigneePersonId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp without time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp without time zone, "clientAwarderContractId" integer, CONSTRAINT "PK_569e0c3e863ebdf5f2408ee1670" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."FacilityTypeEnum" AS ENUM('PRE_FACTORING', 'TERM_FINANCING', 'POST_FACTORING', 'BANK_GUARANTEE', 'SALARY_ADVANCE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "facility" ("id" SERIAL NOT NULL, "facilityType" "public"."FacilityTypeEnum" NOT NULL, "facilityLimit" numeric NOT NULL, "remark" character varying, "marginOfFactoring" numeric NOT NULL, "creditPeriodEndDate" TIMESTAMP NOT NULL, "gracePeriodEndDate" TIMESTAMP NOT NULL, "profitRateT1" numeric NOT NULL, "profitRateT2" numeric NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp without time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp without time zone, "applicationId" integer, CONSTRAINT "PK_07c6c82781d105a680b5c265be6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_supporting_document" ADD CONSTRAINT "FK_20c4be58213e8af3ba5b2ad49e0" FOREIGN KEY ("applicationId") REFERENCES "application"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_public" ADD CONSTRAINT "FK_63cba9dd5d0d0be4a09e15b0439" FOREIGN KEY ("applicationId") REFERENCES "application"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "application" ADD CONSTRAINT "FK_8c1854ee48799ec5e120bd60152" FOREIGN KEY ("clientAwarderContractId") REFERENCES "client_awarder_contract"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "facility" ADD CONSTRAINT "FK_55fdbd86e2e66d5607d282fd4ec" FOREIGN KEY ("applicationId") REFERENCES "application"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "facility" DROP CONSTRAINT "FK_55fdbd86e2e66d5607d282fd4ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "application" DROP CONSTRAINT "FK_8c1854ee48799ec5e120bd60152"`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_public" DROP CONSTRAINT "FK_63cba9dd5d0d0be4a09e15b0439"`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_supporting_document" DROP CONSTRAINT "FK_20c4be58213e8af3ba5b2ad49e0"`,
    );
    await queryRunner.query(`DROP TABLE "facility"`);
    await queryRunner.query(`DROP TYPE "public"."FacilityTypeEnum"`);
    await queryRunner.query(`DROP TABLE "application"`);
    // await queryRunner.query(`DROP TYPE "public"."CurrencyCodeEnum"`);
    await queryRunner.query(`DROP TYPE "public"."LeadSourceEnum"`);
    await queryRunner.query(`DROP TYPE "public"."ApplicationStatusEnum"`);
    await queryRunner.query(`DROP TABLE "application_public"`);
    await queryRunner.query(`DROP TABLE "client_awarder_contract"`);
    await queryRunner.query(`DROP TYPE "public"."CurrencyCodeEnum"`);
    await queryRunner.query(
      `DROP TYPE "public"."ClientAwarderContractCollectionMethodEnum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."ClientAwarderContractFundingChannelEnum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."ClientAwarderContractAssignmentMethodEnum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."ClientAwarderContractNatureEnum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."ClientAwarderContractTypeEnum"`,
    );
    await queryRunner.query(`DROP TABLE "application_supporting_document"`);
    await queryRunner.query(
      `DROP TYPE "public"."ApplicationSupportingDocumentTypeEnum"`,
    );
  }
}
