import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import { DatabaseModule } from '@app/common/database/database.module';
import { OutboxEvent } from '@app/common/database/outbox-event.entity';
import { RemotePermissionGuard } from '@app/common/rbac/remote-permission.guard';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import {
  Deal,
  DealStageHistory,
  Lead,
  SiteVisitReport,
} from '../models/crm.entity';
import { ApplicantIntake } from '../models/applicant-intake.entity';
import { ProcessedEvent } from '@app/common/database/processed-event.entity';
import { ProcessedEventRepository } from '../repositories';
import {
  WebIntakeConsumerController,
  WebIntakeController,
} from './web-intake.controller';
import { WebIntakeService } from './web-intake.service';
import { OutboxEventRepository } from '../repositories';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { OutboxRelayService } from './outbox-relay.service';

@Module({
  imports: [
    DatabaseModule.forFeature([
      Lead,
      Deal,
      DealStageHistory,
      SiteVisitReport,
      OutboxEvent,
      ApplicantIntake,
      ProcessedEvent,
    ]),
    ScheduleModule.forRoot(),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    // First producer in this service — promotion writes SEND_EMAIL +
    // SLA_TIMER_START to the outbox, the relay publishes them.
    ClientsModule.registerAsync([
      {
        name: DependencyInjectionTokenEnum.KAFKA_PRODUCER,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'customer-relationship-management',
              brokers: configService
                .getOrThrow<string>('KAFKA_BROKERS')
                .split(','),
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [CrmController, WebIntakeController, WebIntakeConsumerController],
  providers: [
    CrmService,
    WebIntakeService,
    ProcessedEventRepository,
    RemotePermissionGuard,
    OutboxEventRepository,
    OutboxRelayService,
  ],
})
export class CrmModule {}
