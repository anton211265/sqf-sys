import { Module } from '@nestjs/common';
import { HederaModule } from '../hedera/hedera.module';
import { DatabaseModule } from '@app/common/database/database.module';
import { Onchain } from '../../models/onchain.entity';
import { CONSENSUS_MESSAGING_SERVICE } from './consensus-messaging.interface';
import { ConsensusMessagingService } from './consensus-messaging.service';
import { OnchainRepository } from '../../repositories/onchain.repository';
import { ConsensusMessagingControlelr } from './consensus-messaging.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TRADE_SERVICE } from '@app/common/constants/services';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    HederaModule,
    DatabaseModule,
    DatabaseModule.forFeature([Onchain]),
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
              groupId: 'auth-consumer-document-management-consensus-messaging',
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
  ],
  providers: [
    {
      provide: CONSENSUS_MESSAGING_SERVICE,
      useClass: ConsensusMessagingService,
    },
    OnchainRepository,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
  controllers: [ConsensusMessagingControlelr],
  exports: [CONSENSUS_MESSAGING_SERVICE],
})
export class ConsensusMessagingModule {}
