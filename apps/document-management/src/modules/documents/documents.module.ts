import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { S3Client } from '@aws-sdk/client-s3';
import { DatabaseModule } from '@app/common/database/database.module';
import { TRADE_SERVICE } from '@app/common/constants/services';
import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import { OutboxEvent } from '@app/common/database/outbox-event.entity';
import { ProcessedEvent } from '@app/common/database/processed-event.entity';
import { StoredDocument } from '../../models/document.entity';
import { DocumentEvent } from '../../models/document-event.entity';
import { DocumentRepository } from '../../repositories/document.repository';
import { DocumentEventRepository } from '../../repositories/document-event.repository';
import { OutboxEventRepository } from '../../repositories/outbox-event.repository';
import { ProcessedEventRepository } from '../../repositories/processed-event.repository';
import { OutboxRelayService } from './outbox-relay.service';
import { CrossValidationService } from './cross-validation.service';
import { InvoiceMathService } from './invoice-math.service';
import { DocumentsValidationController } from './documents-validation.controller';
import { MarkitdownModule } from '../markitdown/markitdown.module';
import { VisionExtractionModule } from '../vision-extraction/vision-extraction.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { ClaudeExtractionService } from './claude-extraction.service';
import { DocumentExtractionProcessor } from './document-extraction.processor';

// Phase 1 of the document-management redesign (CLAUDE.md "Planned: Document
// Management redesign") — storage core: immutable-object metadata, SHA-256
// integrity hashing, append-only document_event audit, presigned retrieval.
@Module({
  imports: [
    MarkitdownModule,
    VisionExtractionModule,
    DatabaseModule,
    DatabaseModule.forFeature([
      StoredDocument,
      DocumentEvent,
      OutboxEvent,
      ProcessedEvent,
    ]),
    ClientsModule.registerAsync([
      {
        name: DependencyInjectionTokenEnum.KAFKA_PRODUCER,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'document-management',
              brokers: configService.getOrThrow('KAFKA_BROKERS').split(','),
              ssl: configService.getOrThrow('KAFKA_BROKER_SSL') === 'true',
            },
          },
        }),
        inject: [ConfigService],
      },
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
              groupId: 'auth-consumer-document-management-documents',
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [DocumentsController, DocumentsValidationController],
  providers: [
    {
      provide: 'S3Client',
      useFactory: (configService: ConfigService) => {
        // S3_ENDPOINT set = local dev against MinIO (path-style addressing);
        // unset = real AWS S3 in production.
        const endpoint = configService.get<string>('S3_ENDPOINT');
        return new S3Client({
          region: configService.getOrThrow('AWS_S3_REGION'),
          credentials: {
            accessKeyId: configService.getOrThrow('AWS_ACCESS_KEY_ID'),
            secretAccessKey: configService.getOrThrow('AWS_SECRET_ACCESS_KEY'),
          },
          ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
        });
      },
      inject: [ConfigService],
    },
    DocumentsService,
    ClaudeExtractionService,
    CrossValidationService,
    InvoiceMathService,
    DocumentExtractionProcessor,
    OutboxRelayService,
    DocumentRepository,
    DocumentEventRepository,
    OutboxEventRepository,
    ProcessedEventRepository,
  ],
  exports: [DocumentsService],
})
export class DocumentsModule {}
