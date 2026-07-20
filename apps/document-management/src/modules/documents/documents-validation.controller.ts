import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { DocumentValidationDataEvent } from '@app/common/apps/common/interface/document-validation-data-event.interface';
import { ProcessedEventRepository } from '../../repositories/processed-event.repository';
import { DocumentsService } from './documents.service';

// Kafka-only controller — deliberately separate from DocumentsController,
// whose class-level JWT guard assumes an HTTP context.
@Controller()
export class DocumentsValidationController {
  private readonly logger = new Logger(DocumentsValidationController.name);

  constructor(
    private readonly documentsService: DocumentsService,
    private readonly processedEventRepository: ProcessedEventRepository,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  @EventPattern(KafkaTopicEnum.DOCUMENT_VALIDATION_DATA)
  async handleValidationData(
    @Payload() event: DocumentValidationDataEvent,
  ): Promise<void> {
    if (await this.processedEventRepository.exists(event.eventId)) {
      this.logger.warn(
        `Skipping already-processed DOCUMENT_VALIDATION_DATA event: ${event.eventId}`,
      );
      return;
    }

    await this.documentsService.applyValidationData(event);

    await this.entityManager.transaction(async (manager) => {
      await this.processedEventRepository.record(manager, {
        id: event.eventId,
        topic: KafkaTopicEnum.DOCUMENT_VALIDATION_DATA,
      });
    });
  }
}
