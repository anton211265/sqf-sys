import { DatabaseModule } from '@app/common/database/database.module';
import { LoggerModule } from '@app/common/logger/logger.module';
import { CaslModule } from '@app/common/modules/casl/casl.module';
import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { z } from 'zod';
import { AuthModule } from './auth/auth.module';
import { KycAgencyModule } from './kyc-agency/kyc-agency.module';
import {
  ClientPersona,
  BuyerPersona,
  KycAgencyReport,
  Organization,
  OrganizationPerson,
  OrganizationPersonRole,
  OrganizationRole,
  Person,
  SupplierPersona,
} from './models';
import {
  ClientPersonaRepository,
  BuyerPersonaRepository,
  KycAgencyReportRepository,
  OrganizationPersonRepository,
  OrganizationPersonRoleRepository,
  OrganizationRepository,
  PersonRepository,
  SupplierPersonaRepository,
} from './repositories';
import { RelationshipModule } from './relationship/relationship.module';
import { ContractModule } from './contract/contract.module';
import { InvoiceModule } from './invoice/invoice.module';
import { LendingProductSubscriptionModule } from './lending-product-subscription/lending-product-subscription.module';
import { SqfOrganizationModule } from './sqf/organization/organization.module';
import { SqfKycAgencyModule } from './sqf/kyc-agency/kyc-agency.module';
import { SqfPersonModule } from './sqf/person/person.module';
import { SqfOrganizationPersonModule } from './sqf/organization-person/organization-person.module';
import { SystemSetupModule } from './system-setup/system-setup.module';
import { Token } from './models/token.entity';

@Module({
  imports: [
    CaslModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule,
    DatabaseModule,
    DatabaseModule.forFeature([
      Person,
      Token,
      OrganizationRole,
      OrganizationPersonRole,
      OrganizationPerson,
      Organization,
      ClientPersona,
      BuyerPersona,
      SupplierPersona,
      KycAgencyReport,
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      validate(config) {
        return z
          .object({
            ROOT_DIR: z.string(),
            PORT: z.coerce.number(),
            KAFKA_BROKERS: z.string(),
            RISK_OPERATION_URL: z.string(),
            FRONTEND_DOMAIN: z.string(),
          })
          .parse(config);
      },
    }),

    ScheduleModule.forRoot(),
    LoggerModule,
    KycAgencyModule,

    // ----------------------TRADE NETWORK----------------------
    RelationshipModule,
    ContractModule,
    InvoiceModule,
    LendingProductSubscriptionModule,
    // ----------------------TRADE NETWORK----------------------

    // ----------------------SQF----------------------
    SqfOrganizationModule,
    SqfKycAgencyModule,
    SqfPersonModule,
    SqfOrganizationPersonModule,
    // ----------------------SQF----------------------

    // ----------------------SYSTEM SETUP----------------------
    SystemSetupModule,
    // ----------------------SYSTEM SETUP----------------------
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    PersonRepository,
    OrganizationPersonRoleRepository,
    OrganizationPersonRepository,
    OrganizationRepository,
    ClientPersonaRepository,
    BuyerPersonaRepository,
    SupplierPersonaRepository,
    KycAgencyReportRepository,
  ],
})
export class TradeDirectoryModule {}
