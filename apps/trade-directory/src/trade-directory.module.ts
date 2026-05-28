import { DatabaseModule } from '@app/common/database/database.module';
import { LoggerModule } from '@app/common/logger/logger.module';
import { CaslModule } from '@app/common/modules/casl/casl.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { z } from 'zod';
import { ApplicationPublicModule } from './application-public/application-public.module';
import { AuthModule } from './auth/auth.module';
import { BankAccountModule } from './bank-account/bank-account.module';
import { ClientPersonaModule } from './client-persona/client-persona.module';
import { ContractAwarderPersonaModule } from './contract-awarder-persona/contract-awarder-persona.module';
import { ExperianModule } from './experian/experian.module';
import { FactorPersonaModule } from './factor-persona/factor-persona.module';
import {
  BankAccount,
  ClientPersona,
  ContractAwarderPersona,
  Experian,
  Organization,
  OrganizationPerson,
  OrganizationPersonRole,
  OrganizationRole,
  Person,
  PersonSupportingDocument,
  SupplierPersona,
  Transaction,
} from './models';
import { OrganizationPersonModule } from './organization-person/organization-person.module';
import { OrganizationModule } from './organization/organization.module';
import { PersonSupportingDocumentModule } from './person-supporting-document/person-supporting-document.module';
import { PersonModule } from './person/person.module';
import {
  BankAccountRepository,
  ClientPersonaRepository,
  ContractAwarderPersonaRepository,
  ExperianRepository,
  OrganizationPersonRepository,
  OrganizationPersonRoleRepository,
  OrganizationRepository,
  PersonRepository,
  PersonSupportingDocumentRepository,
  SupplierPersonaRepository,
  TransactionRepository,
} from './repositories';
import { SupplierPersonaModule } from './supplier-persona/supplier-persona.module';
import { SqfOrganizationModule } from './sqf/organization/organization.module';
import { SqfExperianModule } from './sqf/experian/experian.module';
import { SqfPersonModule } from './sqf/person/person.module';
import { SqfOrganizationPersonModule } from './sqf/organization-person/organization-person.module';
import { Token } from './models/token.entity';

@Module({
  imports: [
    CaslModule,
    AuthModule,
    DatabaseModule,
    DatabaseModule.forFeature([
      BankAccount,
      PersonSupportingDocument,
      Person,
      Token,
      OrganizationRole,
      OrganizationPersonRole,
      OrganizationPerson,
      Organization,
      ClientPersona,
      ContractAwarderPersona,
      SupplierPersona,
      Experian,
      Transaction,
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

    // ----------------------LCM----------------------
    ScheduleModule.forRoot(),
    LoggerModule,
    BankAccountModule,
    PersonSupportingDocumentModule,
    OrganizationPersonModule,
    OrganizationModule,
    ClientPersonaModule,
    ContractAwarderPersonaModule,
    SupplierPersonaModule,
    FactorPersonaModule,
    PersonModule,
    ApplicationPublicModule,
    ExperianModule,
    // ----------------------LCM----------------------

    // ----------------------SQF----------------------
    SqfOrganizationModule,
    SqfExperianModule,
    SqfPersonModule,
    SqfOrganizationPersonModule,
    // ----------------------SQF----------------------
  ],
  providers: [
    BankAccountRepository,
    PersonSupportingDocumentRepository,
    PersonRepository,
    OrganizationPersonRoleRepository,
    OrganizationPersonRepository,
    OrganizationRepository,
    ClientPersonaRepository,
    ContractAwarderPersonaRepository,
    SupplierPersonaRepository,
    ExperianRepository,
    TransactionRepository,
  ],
})
export class TradeDirectoryModule {}
