import { Module } from '@nestjs/common';
import { OrganizationPersonService } from './organization-person.service';
import { OrganizationPersonController } from './organization-person.controller';
import { DatabaseModule } from '@app/common/database/database.module';
import {
  Organization,
  OrganizationPerson,
  Person,
  ResetPasswordToken,
} from '../../models';
import {
  OrganizationPersonRepository,
  OrganizationRepository,
  PersonRepository,
} from '../../repositories';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TRADE_SERVICE } from '@app/common/constants/services';
import { ConfigService } from '@nestjs/config';
import { ResetPasswordTokenRepository } from '../../repositories/reset-password-token.repository';

@Module({
  imports: [
    DatabaseModule.forFeature([
      OrganizationPerson,
      Organization,
      Person,
      ResetPasswordToken,
    ]),
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
  controllers: [OrganizationPersonController],
  providers: [
    OrganizationPersonService,
    OrganizationPersonRepository,
    OrganizationRepository,
    PersonRepository,
    ResetPasswordTokenRepository,
  ],
})
export class SqfOrganizationPersonModule {}
