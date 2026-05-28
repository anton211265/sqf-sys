import { Module } from '@nestjs/common';
import { DOCUMENT_MANAGEMENT_CRON_SERVICE } from './cron.interface';
import { DocumentExtraction } from '../models/document-extraction.entity';
import { DocumentExtractionRepository } from '../repositories/document-extraction.repository';
import { DatabaseModule } from '@app/common/database/database.module';
import { LLMModule } from '../modules/llm/llm.modules';
import { Webhook } from '../models/webhook.entity';
import { WebhookLog } from '../models/webhook-log.entity';
import { WebhookRepository } from '../repositories/webhook.repository';
import { WebhookLogRepository } from '../repositories/webhook-log.repository';
import { DocumentManagementCronService } from './cron.service';
import { DocumentExtractionModule } from '../modules/document-extraction/document-extraction.module';
import { Onchain } from '../models/onchain.entity';
import { OnchainRepository } from '../repositories/onchain.repository';
import { ConsensusMessagingModule } from '../modules/consensus-messaging/consensus-messaging.module';
import { PromptTemplate } from '../models/prompt-template.entity';
import { PromptTemplateRepository } from '../repositories/prompt-template.repository';
import { OCRModule } from '../modules/ocr/ocr.module';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([
      DocumentExtraction,
      Webhook,
      WebhookLog,
      Onchain,
      PromptTemplate,
    ]),
    LLMModule,
    OCRModule,
    DocumentExtractionModule,
    ConsensusMessagingModule,
  ],
  providers: [
    {
      provide: DOCUMENT_MANAGEMENT_CRON_SERVICE,
      useClass: DocumentManagementCronService,
    },
    DocumentExtractionRepository,
    WebhookRepository,
    WebhookLogRepository,
    OnchainRepository,
    PromptTemplateRepository,
  ],
})
export class DocumentManagementCronModule {}
