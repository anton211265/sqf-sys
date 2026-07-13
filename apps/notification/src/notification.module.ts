import { DatabaseModule } from '@app/common/database/database.module';
import { LoggerModule } from '@app/common/logger/logger.module';
import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { z } from 'zod';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    DatabaseModule,
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
    LoggerModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },],
})
export class NotificationModule {}
