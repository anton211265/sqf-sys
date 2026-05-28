import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import { DatabaseModule } from '@app/common/database/database.module';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { z } from 'zod';
import { Experian, Organization } from '../models';
import { ExperianRepository, OrganizationRepository } from '../repositories';
import { ExperianController } from './experian.controller';
import {
  biXmlParser,
  ciXmlParser,
  defaultXmlBuilder,
  defaultXmlParser,
} from './experian.parser';
import { ExperianService } from './experian.service';

@Module({
  imports: [
    DatabaseModule.forFeature([Experian, Organization]),
    ConfigModule.forRoot({
      isGlobal: true,
      validate(config) {
        return z
          .object({
            EXPERIAN_API_BASE_URL: z.string(),
            EXPERIAN_API_USERNAME: z.string(),
            EXPERIAN_API_PASSWORD: z.string(),
          })
          .parse(config);
      },
    }),
    HttpModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.getOrThrow('EXPERIAN_API_BASE_URL'),
        headers: {
          'Content-Type': 'application/xml',
          Authorization: `Basic ${Buffer.from(
            `${configService.getOrThrow(
              'EXPERIAN_API_USERNAME',
            )}:${configService.getOrThrow('EXPERIAN_API_PASSWORD')}`,
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
  controllers: [ExperianController],
  providers: [
    ExperianService,
    ExperianRepository,
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
  ],
  exports: [ExperianService],
})
export class ExperianModule {}
