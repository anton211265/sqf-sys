import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { DocumentExtractedEvent } from '@app/common/apps/common/interface/document-extracted-event.interface';
import { DocumentClassEnum } from '@app/common/apps/document-management/enums/document-class.enum';
import { ProcessedEventRepository } from '../../repositories/processed-event.repository';
import { FinancialReportIntakeService } from './financial-report-intake.service';

@Controller()
export class FinancialReportIntakeController {
  private readonly logger = new Logger(FinancialReportIntakeController.name);

  constructor(
    private readonly financialReportIntakeService: FinancialReportIntakeService,
    private readonly processedEventRepository: ProcessedEventRepository,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  @EventPattern(KafkaTopicEnum.DOCUMENT_EXTRACTED)
  async handleDocumentExtracted(
    @Payload() event: DocumentExtractedEvent,
  ): Promise<void> {
    // This consumer only ingests financial statements; other classes are
    // handled by other services.
    if (event.documentClass !== DocumentClassEnum.FINANCIAL_STATEMENTS) {
      return;
    }

    if (await this.processedEventRepository.exists(event.eventId)) {
      this.logger.warn(
        `Skipping already-processed DOCUMENT_EXTRACTED event: ${event.eventId}`,
      );
      return;
    }

    await this.financialReportIntakeService.ingest(event);

    await this.entityManager.transaction(async (manager) => {
      await this.processedEventRepository.record(manager, {
        id: event.eventId,
        topic: KafkaTopicEnum.DOCUMENT_EXTRACTED,
      });
    });
  }
}
