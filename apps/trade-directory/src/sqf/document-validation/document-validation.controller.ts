import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { DocumentExtractedEvent } from '@app/common/apps/common/interface/document-extracted-event.interface';
import { DocumentClassEnum } from '@app/common/apps/document-management/enums/document-class.enum';
import { ProcessedEventRepository } from '../../repositories';
import { DocumentValidationService } from './document-validation.service';

@Controller()
export class DocumentValidationController {
  private readonly logger = new Logger(DocumentValidationController.name);

  constructor(
    private readonly documentValidationService: DocumentValidationService,
    private readonly processedEventRepository: ProcessedEventRepository,
  ) {}

  @EventPattern(KafkaTopicEnum.DOCUMENT_EXTRACTED)
  async handleDocumentExtracted(
    @Payload() event: DocumentExtractedEvent,
  ): Promise<void> {
    if (event.documentClass !== DocumentClassEnum.COMPANY_REGISTRY) {
      return;
    }

    if (await this.processedEventRepository.exists(event.eventId)) {
      this.logger.warn(
        `Skipping already-processed DOCUMENT_EXTRACTED event: ${event.eventId}`,
      );
      return;
    }

    await this.documentValidationService.provideValidationData(event);
  }
}
