import { Module } from '@nestjs/common';
import { ApplicationPersonService } from './application-person.service';
import { ApplicationPersonController } from './application-person.controller';
import { Application, ApplicationPerson } from '../../models';
import { DatabaseModule } from '@app/common/database/database.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TRADE_SERVICE } from '@app/common/constants/services';
import { ConfigService } from '@nestjs/config';
import { ApplicationPersonRepository } from '../../repositories/application-person.repository';
import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import { OrganizationRepository } from 'apps/trade-directory/src/repositories/organization.repository';
import { Organization } from 'apps/trade-directory/src/models';
import { ApplicationRepository } from '../../repositories/application.repository';

@Module({
  imports: [
    DatabaseModule.forFeature([ApplicationPerson, Application]),
    ClientsModule.registerAsync([
      {
        name: DependencyInjectionTokenEnum.KAFKA_PRODUCER, // This name will be used to inject the Kafka client
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'risk-operation',
              brokers: configService.get('KAFKA_BROKERS').split(','),
              ssl: configService.getOrThrow('KAFKA_BROKER_SSL') === 'true',
            },
            consumer: {
              groupId: 'application-person-consumer', // Consumer group for message consumption
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [ApplicationPersonController],
  providers: [ApplicationPersonService, ApplicationPersonRepository, ApplicationRepository],
})
export class ApplicationPersonModule {}
