import { LoggerModule } from '@app/common/logger/logger.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { z } from 'zod';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    EmailModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validate(config) {
        return z
          .object({
            ROOT_DIR: z.string(),
            PORT: z.coerce.number(),
            KAFKA_BROKERS: z.string(),
            FRONTEND_DOMAIN: z.string(),
          })
          .parse(config);
      },
    }),
    LoggerModule,
  ],
  controllers: [],
  providers: [],
})
export class NotificationModule {}
