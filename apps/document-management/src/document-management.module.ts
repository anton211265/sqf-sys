import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { LoggerModule } from '@app/common/logger/logger.module';
import { DocumentsModule } from './modules/documents/documents.module';

// Redesigned service (2026-07-19, CLAUDE.md "Planned: Document Management
// redesign"): document storage with integrity hashing, Claude field
// extraction, cross-validation, invoice math gate, Kafka outbox. The legacy
// pipeline (DeepSeek + prompt templates, API-key auth, webhooks, Hedera
// consensus messaging) was removed in Phase 6 of the rebuild.
@Module({
  imports: [
    ScheduleModule.forRoot(),
    DocumentsModule,
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().required(),
        AWS_ACCESS_KEY_ID: Joi.string().required(),
        AWS_SECRET_ACCESS_KEY: Joi.string().required(),
        AWS_S3_REGION: Joi.string().required(),
        // Set in local dev to point at the docker-compose MinIO; unset in
        // production (real S3).
        S3_ENDPOINT: Joi.string().optional(),
        DOCUMENT_EXTRACTION_BUCKET_NAME: Joi.string().required(),
        MARKITDOWN_BIN_PATH: Joi.string().required(),
        ANTHROPIC_API_KEY: Joi.string().required(),
        ANTHROPIC_MODEL: Joi.string().required(),
      }),
    }),
  ],
})
export class DocumentManagementModule {}
