import { DatabaseModule } from '@app/common/database/database.module';
import { LoggerModule } from '@app/common/logger/logger.module';
import { CaslModule } from '@app/common/modules/casl/casl.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { z } from 'zod';
import { ClientAssigneeModule } from './client-assignee/client-assignee.module';
import { ClientAssignee } from './models';
import { ClientAssigneeRepository } from './repositories';

@Module({
  imports: [
    CaslModule,
    DatabaseModule,
    DatabaseModule.forFeature([ClientAssignee]),
    ConfigModule.forRoot({
      isGlobal: true,
      validate(config) {
        return z
          .object({
            ROOT_DIR: z.string(),
            PORT: z.coerce.number(),
            KAFKA_BROKERS: z.string(),
            TRADE_DIRECTORY_URL: z.string(),
            FRONTEND_DOMAIN: z.string(),
          })
          .parse(config);
      },
    }),
    LoggerModule,
    ClientAssigneeModule,
  ],
  controllers: [],
  providers: [ClientAssigneeRepository],
})
export class CustomerRelationshipManagementModule {}
