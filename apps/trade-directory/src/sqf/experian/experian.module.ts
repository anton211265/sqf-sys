import { Module } from '@nestjs/common';
import { ExperianService } from '../../experian/experian.service';
import { ExperianController } from './experian.controller';
import { TRADE_SERVICE } from '@app/common/constants/services';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Experian, Organization } from '../../models';
import { DatabaseModule } from '@app/common/database/database.module';
import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import {
  biXmlParser,
  ciXmlParser,
  defaultXmlBuilder,
  defaultXmlParser,
} from '../../experian/experian.parser';
import { ExperianModule } from '../../experian/experian.module';  
import { ExperianRepository, OrganizationRepository } from '../../repositories';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    DatabaseModule.forFeature([Experian, Organization]),
    ClientsModule.registerAsync([
      {
        name: DependencyInjectionTokenEnum.KAFKA_PRODUCER, // This name will be used to inject the Kafka client
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
    ExperianModule,  // This is LCM Experian Module
    HttpModule,
  ],
  controllers: [ExperianController],
  providers: [
    ExperianService,
    ExperianRepository,
    OrganizationRepository,
    {
      provide: DependencyInjectionTokenEnum.DEFAULT_XML_BUILDER,
      useValue: defaultXmlBuilder,
    },
    {
      provide: DependencyInjectionTokenEnum.DEFAULT_XML_PARSER,
      useValue: defaultXmlParser,
    },
    {
      provide: DependencyInjectionTokenEnum.CI_XML_PARSER,
      useValue: ciXmlParser,
    },
    {
      provide: DependencyInjectionTokenEnum.BI_XML_PARSER,
      useValue: biXmlParser,
    },
  ],
})
export class SqfExperianModule {}
