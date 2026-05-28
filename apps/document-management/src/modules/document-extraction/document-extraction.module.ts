import { Module } from '@nestjs/common';
import { DocumentExtractionController } from './document-extraction.controller';
import { DOCUMENT_EXTRACTION_SERVICE } from './document-extraction.interface';
import { DocumentExtractionService } from './document-extraction.service';
import { DocumentExtractionRepository } from '../../repositories/document-extraction.repository';
import { DatabaseModule } from '@app/common/database/database.module';
import { DocumentExtraction } from '../../models/document-extraction.entity';
import { PromptTemplate } from '../../models/prompt-template.entity';
import { PromptTemplateRepository } from '../../repositories/prompt-template.repository';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { OCRModule } from '../ocr/ocr.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TRADE_SERVICE } from '@app/common/constants/services';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    OCRModule,
    DatabaseModule,
    DatabaseModule.forFeature([DocumentExtraction, PromptTemplate]),
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
              groupId: 'auth-consumer-document-management-auth',
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
  controllers: [DocumentExtractionController],
  providers: [
    {
      provide: 'S3Client',
      useFactory: (configService: ConfigService) => {
        const region = configService.getOrThrow('AWS_S3_REGION');
        const accessKeyId = configService.getOrThrow('AWS_ACCESS_KEY_ID');
        const secretAccessKey = configService.getOrThrow(
          'AWS_SECRET_ACCESS_KEY',
        );

        return new S3Client({
          region,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
      },
      inject: [ConfigService],
    },
    {
      provide: DOCUMENT_EXTRACTION_SERVICE,
      useClass: DocumentExtractionService,
    },
    DocumentExtractionRepository,
    PromptTemplateRepository,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
  exports: [DOCUMENT_EXTRACTION_SERVICE],
})
export class DocumentExtractionModule {}
