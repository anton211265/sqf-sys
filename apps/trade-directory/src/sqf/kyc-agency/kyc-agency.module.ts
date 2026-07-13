import { Module } from '@nestjs/common';
import { KycAgencyService } from '../../kyc-agency/kyc-agency.service';
import { KycAgencyController } from './kyc-agency.controller';
import { TRADE_SERVICE } from '@app/common/constants/services';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KycAgencyReport, Organization } from '../../models';
import { DatabaseModule } from '@app/common/database/database.module';
import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import {
  biXmlParser,
  ciXmlParser,
  defaultXmlBuilder,
  defaultXmlParser,
} from '../../kyc-agency/kyc-agency.parser';
import { OutboxEvent } from '@app/common/database/outbox-event.entity';
import { ProcessedEvent } from '@app/common/database/processed-event.entity';
import { KycAgencyModule } from '../../kyc-agency/kyc-agency.module';
import {
  KycAgencyReportRepository,
  OrganizationRepository,
  OutboxEventRepository,
  ProcessedEventRepository,
} from '../../repositories';
import { OutboxRelayService } from '../../outbox/outbox-relay.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    DatabaseModule.forFeature([KycAgencyReport, Organization, OutboxEvent, ProcessedEvent]),
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
    KycAgencyModule,
    HttpModule,
  ],
  controllers: [KycAgencyController],
  providers: [
    KycAgencyService,
    KycAgencyReportRepository,
    OrganizationRepository,
    OutboxEventRepository,
    ProcessedEventRepository,
    OutboxRelayService,
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
export class SqfKycAgencyModule {}
