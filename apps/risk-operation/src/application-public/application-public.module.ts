import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import { DatabaseModule } from '@app/common/database/database.module';
import { AwsS3Module } from '@app/common/modules/aws-s3/aws-s3.module';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import * as path from 'path';
import {
  Application,
  ApplicationPublic,
  ApplicationSupportingDocument,
  ClientAwarderContract,
} from '../models';
import {
  ApplicationPublicRepository,
  ApplicationRepository,
  ApplicationSupportingDocumentRepository,
  ClientAwarderContractRepository,
} from '../repositories';
import { ApplicationPublicController } from './application-public.controller';
import { ApplicationPublicService } from './application-public.service';

@Module({
  imports: [
    DatabaseModule.forFeature([
      ApplicationPublic,
      Application,
      ClientAwarderContract,
      ApplicationSupportingDocument,
    ]),
    ClientsModule.registerAsync([
      {
        name: DependencyInjectionTokenEnum.TRADE_DIRECTORY_GRPC_CLIENT,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            url: `${configService.getOrThrow('TRADE_DIRECTORY_URL')}:5000`,
            package: 'trade_directory',
            protoPath: path.resolve(
              configService.getOrThrow('ROOT_DIR'),
              './apps/trade-directory/proto/main.proto',
            ),
            loader: {
              arrays: true,
              enums: String,
              includeDirs: [
                path.resolve(configService.getOrThrow('ROOT_DIR'), './apps'),
              ],
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: DependencyInjectionTokenEnum.KAFKA_PRODUCER,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'risk-operation',
              brokers: configService
                .getOrThrow<string>('KAFKA_BROKERS')
                .split(','),
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    AwsS3Module,
  ],
  controllers: [ApplicationPublicController],
  providers: [
    ApplicationPublicService,
    ApplicationPublicRepository,
    ApplicationRepository,
    ClientAwarderContractRepository,
    ApplicationSupportingDocumentRepository,
  ],
})
export class ApplicationPublicModule {}
