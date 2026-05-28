import { Module } from '@nestjs/common';
import { DatabaseModule } from '@app/common/database/database.module';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { OrganizationRepository } from '../../repositories';
import { Organization } from '../../models';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TRADE_SERVICE } from '@app/common/constants/services';
import { ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    DatabaseModule.forFeature([Organization]),
    HttpModule, // Import HttpModule for HttpService
    ClientsModule.registerAsync([
      {
        name: TRADE_SERVICE, // This name will be used to inject the Kafka client
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: TRADE_SERVICE, // ClientId for the producer/consumer
              brokers: configService.get('KAFKA_BROKERS').split(','),
              ssl: configService.getOrThrow('KAFKA_BROKER_SSL') === 'true',
            },
            consumer: {
              groupId: 'organization-consumer', // Consumer group for message consumption
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService, OrganizationRepository],
  exports: [OrganizationService],
})
export class SqfOrganizationModule {}
