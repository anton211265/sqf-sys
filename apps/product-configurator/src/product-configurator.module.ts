import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import { OutboxEvent } from '@app/common/database/outbox-event.entity';
import { ProcessedEvent } from '@app/common/database/processed-event.entity';
import { DatabaseModule } from '@app/common/database/database.module';
import { LoggerModule } from '@app/common/logger/logger.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { z } from 'zod';
import { AssignmentsController } from './assignments/assignments.controller';
import { AssignmentsService } from './assignments/assignments.service';
import { ConfigAuditService } from './audit/config-audit.service';
import { BillingController } from './billing/billing.controller';
import { BillingService } from './billing/billing.service';
import { CalendarController } from './calendar/calendar.controller';
import { CalendarService } from './calendar/calendar.service';
import { LegalTemplatesController } from './legal-templates/legal-templates.controller';
import { LegalTemplatesService } from './legal-templates/legal-templates.service';
import {
  ApprovalMatrixRule,
  BaseRateIndex,
  CalendarDay,
  ClientProductAssignment,
  CreditLimitRange,
  FeeSchedule,
  FunderConfigSettings,
  LegalDocumentTemplate,
  MasterRateCard,
  Product,
  ProductConfigAuditLog,
  ProductDocumentMapping,
  ProductRiskFilterAssignment,
  SlaTemplate,
  SlaTimer,
} from './models';
import { PoliciesController } from './policies/policies.controller';
import { PoliciesService } from './policies/policies.service';
import { ConfigSettingsService } from './settings/config-settings.service';
import { ProcessedEventRepository } from './repositories/processed-event.repository';
import { SlaBreachService } from './sla/sla-breach.service';
import { SlaConsumer } from './sla/sla.consumer';
import { SlaController } from './sla/sla.controller';
import { PublicOnboardingController } from './public/public-onboarding.controller';
import { PublicOnboardingService } from './public/public-onboarding.service';
import { SlaTimerService } from './sla/sla-timer.service';
import { OutboxRelayService } from './outbox/outbox-relay.service';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';
import { RateCardsController } from './rate-cards/rate-cards.controller';
import { RateCardsService } from './rate-cards/rate-cards.service';
import { RemotePermissionGuard } from '@app/common/rbac/remote-permission.guard';
import { OutboxEventRepository } from './repositories/outbox-event.repository';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    DatabaseModule.forFeature([
      Product,
      MasterRateCard,
      LegalDocumentTemplate,
      ProductDocumentMapping,
      ClientProductAssignment,
      ProductConfigAuditLog,
      BaseRateIndex,
      FeeSchedule,
      CalendarDay,
      SlaTemplate,
      ApprovalMatrixRule,
      CreditLimitRange,
      FunderConfigSettings,
      SlaTimer,
      ProductRiskFilterAssignment,
      OutboxEvent,
      ProcessedEvent,
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      validate(config) {
        return z
          .object({
            ROOT_DIR: z.string(),
            PORT: z.coerce.number(),
            KAFKA_BROKERS: z.string(),
            FRONTEND_DOMAIN: z.string(),
            JWT_SECRET: z.string(),
            RBAC_MANIFEST_URL: z.string(),
          })
          .parse(config);
      },
    }),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    ClientsModule.registerAsync([
      {
        name: DependencyInjectionTokenEnum.KAFKA_PRODUCER,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'product-configurator',
              brokers: configService
                .getOrThrow<string>('KAFKA_BROKERS')
                .split(','),
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    LoggerModule,
  ],
  controllers: [
    ProductsController,
    RateCardsController,
    LegalTemplatesController,
    AssignmentsController,
    BillingController,
    CalendarController,
    PoliciesController,
    SlaController,
    SlaConsumer,
    PublicOnboardingController,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    RemotePermissionGuard,
    ConfigAuditService,
    ConfigSettingsService,
    ProductsService,
    RateCardsService,
    LegalTemplatesService,
    AssignmentsService,
    BillingService,
    CalendarService,
    PoliciesService,
    SlaTimerService,
    SlaBreachService,
    PublicOnboardingService,
    OutboxEventRepository,
    ProcessedEventRepository,
    OutboxRelayService,
  ],
})
export class ProductConfiguratorModule {}
