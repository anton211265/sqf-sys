import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import { DatabaseModule } from '@app/common/database/database.module';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { z } from 'zod';
import { OutboxEvent } from '@app/common/database/outbox-event.entity';
import { ProcessedEvent } from '@app/common/database/processed-event.entity';
import { KycAgencyReport, Organization } from '../models';
import {
  KycAgencyReportRepository,
  OrganizationRepository,
  OutboxEventRepository,
  ProcessedEventRepository,
} from '../repositories';
import { OutboxRelayService } from '../outbox/outbox-relay.service';
import { KycAgencyController } from './kyc-agency.controller';
import {
  biXmlParser,
  ciXmlParser,
  defaultXmlBuilder,
  defaultXmlParser,
} from './kyc-agency.parser';
import { KycAgencyService } from './kyc-agency.service';

@Module({
  imports: [
    DatabaseModule.forFeature([KycAgencyReport, Organization, OutboxEvent, ProcessedEvent]),
    ConfigModule.forRoot({
      isGlobal: true,
      validate(config) {
        return z
          .object({
            KYC_AGENCY_API_BASE_URL: z.string(),
            KYC_AGENCY_API_USERNAME: z.string(),
            KYC_AGENCY_API_PASSWORD: z.string(),
          })
          .parse(config);
      },
    }),
    HttpModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.getOrThrow('KYC_AGENCY_API_BASE_URL'),
        headers: {
          'Content-Type': 'application/xml',
          Authorization: `Basic ${Buffer.from(
            `${configService.getOrThrow(
              'KYC_AGENCY_API_USERNAME',
            )}:${configService.getOrThrow('KYC_AGENCY_API_PASSWORD')}`,
          ).toString('base64')}`,
          Accept: 'application/xml',
        },
      }),
      inject: [ConfigService],
    }),
    ClientsModule.registerAsync([
      {
        name: DependencyInjectionTokenEnum.KAFKA_PRODUCER,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'trade-directory',
              brokers: configService
                .getOrThrow<string>('KAFKA_BROKERS')
                .split(','),
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [KycAgencyController],
  providers: [
    KycAgencyService,
    KycAgencyReportRepository,
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
    OrganizationRepository,
    OutboxEventRepository,
    ProcessedEventRepository,
    OutboxRelayService,
  ],
  exports: [KycAgencyService],
})
export class KycAgencyModule {}
