import { DatabaseModule } from '@app/common/database/database.module';
import { Module } from '@nestjs/common';
import { Webhook } from '../../models/webhook.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TRADE_SERVICE } from '@app/common/constants/services';
import { ConfigService } from '@nestjs/config';
import { WebhookController } from './webhook.controller';
import { WEBHOOK_SERVICE } from './webhook.interface';
import { WebhookService } from './webhook.service';
import { WebhookRepository } from '../../repositories/webhook.repository';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([Webhook]),
    ClientsModule.registerAsync([
      {
        name: TRADE_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: TRADE_SERVICE,
              brokers: configService.getOrThrow('KAFKA_BROKERS').split(','),
              ssl: configService.getOrThrow('KAFKA_BROKER_SSL') === 'true',
            },
            consumer: {
              groupId: 'auth-consumer-document-management-webhook',
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [WebhookController],
  providers: [
    {
      provide: WEBHOOK_SERVICE,
      useClass: WebhookService,
    },
    WebhookRepository,
  ],
})
export class WebhookModule {}
