import { DatabaseModule } from '@app/common/database/database.module';
import { LoggerModule } from '@app/common/logger/logger.module';
import { OutboxEvent } from '@app/common/database/outbox-event.entity';
import { ProcessedEvent } from '@app/common/database/processed-event.entity';
import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { z } from 'zod';
import {
  RiskAgentQueueItem,
  RiskAgentRecommendation,
  DocumentRequest,
  OrganizationKycRecommendation,
} from './models';
import { OutboxEventRepository, ProcessedEventRepository } from './repositories';
import { OutboxRelayService } from './outbox/outbox-relay.service';
import { RiskOperationClientService } from './tools/risk-operation-client.service';
import { ComplianceStubService } from './tools/compliance-stub.service';
import { RiskAgentService } from './agent/risk-agent.service';
import { QueueController } from './queue/queue.controller';
import { QueueService } from './queue/queue.service';
import { DocumentRequestService } from './document-request/document-request.service';
import { RecommendationController } from './recommendation/recommendation.controller';
import { RecommendationService } from './recommendation/recommendation.service';
import { OrganizationKycController } from './organization-kyc/organization-kyc.controller';
import { OrganizationKycService } from './organization-kyc/organization-kyc.service';
import { OrganizationKycRecommendationController } from './organization-kyc/organization-kyc-recommendation.controller';
import { OrganizationKycRecommendationService } from './organization-kyc/organization-kyc-recommendation.service';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([
      OutboxEvent,
      ProcessedEvent,
      RiskAgentQueueItem,
      RiskAgentRecommendation,
      DocumentRequest,
      OrganizationKycRecommendation,
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
            RISK_OPERATION_BASE_URL: z.string(),
            ANTHROPIC_API_KEY: z.string(),
            ANTHROPIC_MODEL: z.string(),
            HRA_ESCALATION_EMAIL: z.string(),
            POSTGRES_HOST: z.string(),
            POSTGRES_PORT: z.coerce.number(),
            POSTGRES_DATABASE: z.string(),
            POSTGRES_USERNAME: z.string(),
            POSTGRES_PASSWORD: z.string(),
            POSTGRES_SYNCHRONIZE: z.string(),
          })
          .passthrough()
          .parse(config);
      },
    }),
    HttpModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.getOrThrow('RISK_OPERATION_BASE_URL'),
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
              clientId: 'risk-agent',
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
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
  ],
  controllers: [
    QueueController,
    RecommendationController,
    OrganizationKycController,
    OrganizationKycRecommendationController,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    OutboxEventRepository,
    ProcessedEventRepository,
    OutboxRelayService,
    RiskOperationClientService,
    ComplianceStubService,
    RiskAgentService,
    QueueService,
    DocumentRequestService,
    RecommendationService,
    OrganizationKycService,
    OrganizationKycRecommendationService,
  ],
})
export class RiskAgentModule {}
