import { DatabaseModule } from '@app/common/database/database.module';
import { LoggerModule } from '@app/common/logger/logger.module';
import { CaslModule } from '@app/common/modules/casl/casl.module';
import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { z } from 'zod';
import { ProcessedEvent } from '@app/common/database/processed-event.entity';
import { ClientAssigneeModule } from './client-assignee/client-assignee.module';
import { CrmModule } from './crm/crm.module';
import { ClientAssignee } from './models';
import { ClientAssigneeRepository, ProcessedEventRepository } from './repositories';

@Module({
  imports: [
    CaslModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    DatabaseModule,
    DatabaseModule.forFeature([ClientAssignee, ProcessedEvent]),
    ConfigModule.forRoot({
      isGlobal: true,
      validate(config) {
        return z
          .object({
            ROOT_DIR: z.string(),
            PORT: z.coerce.number(),
            KAFKA_BROKERS: z.string(),
            TRADE_DIRECTORY_URL: z.string(),
            JWT_SECRET: z.string(),
            RBAC_MANIFEST_URL: z.string(),
            FRONTEND_DOMAIN: z.string(),
          })
          .parse(config);
      },
    }),
    LoggerModule,
    ClientAssigneeModule,
    CrmModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    ClientAssigneeRepository,
    ProcessedEventRepository,
  ],
})
export class CustomerRelationshipManagementModule {}
