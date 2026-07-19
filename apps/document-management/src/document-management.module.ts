import { Module } from '@nestjs/common';
import { DocumentsModule } from './modules/documents/documents.module';
import { DocumentExtractionModule } from './modules/document-extraction/document-extraction.module';
import { ScheduleModule } from '@nestjs/schedule';
import { DocumentManagementCronModule } from './cron/cron.module';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { LoggerModule } from '@app/common/logger/logger.module';
import { ConsensusMessagingModule } from './modules/consensus-messaging/consensus-messaging.module';
import { AuthModule } from './modules/auth/auth.module';
import { WebhookModule } from './modules/webhook/webhook.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DocumentManagementCronModule,
    DocumentsModule,
    DocumentExtractionModule,
    ConsensusMessagingModule,
    AuthModule,
    LoggerModule,
    WebhookModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DOCUMENT_MANAGEMENT_SECRET_KEY: Joi.string().required(),
        NODE_ENV: Joi.string().required(),
        HEDERA_ACCOUNT_ID: Joi.string().required(),
        HEDERA_PRIVATE_KEY: Joi.string().required(),
        DEEP_SEEK_URL: Joi.string().required(),
        DEEP_SEEK_API_KEY: Joi.string().required(),
        AWS_ACCESS_KEY_ID: Joi.string().required(),
        AWS_SECRET_ACCESS_KEY: Joi.string().required(),
        AWS_S3_REGION: Joi.string().required(),
        DOCUMENT_EXTRACTION_BUCKET_NAME: Joi.string().required(),
        MARKITDOWN_BIN_PATH: Joi.string().required(),
        ANTHROPIC_API_KEY: Joi.string().required(),
        ANTHROPIC_MODEL: Joi.string().required(),
      }),
    }),
  ],
})
export class DocumentManagementModule {}
