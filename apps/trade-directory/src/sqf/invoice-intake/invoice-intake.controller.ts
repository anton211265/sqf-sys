import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { InvoiceExtractionValidatedEvent } from '@app/common/apps/common/interface/invoice-extraction-validated-event.interface';
import { CurrencyCodeEnum } from '@app/common/constants/currencies';
import { ProcessedEventRepository } from '../../repositories';
import { InvoiceService } from '../../invoice/invoice.service';
import { CreateInvoiceDto } from '../../invoice/dto/create-invoice.dto';

// Phase 5 of the document-management redesign: math-gated extracted invoices
// feed the existing lines-only invoice-create path. Issuer/debtor arrive as
// name + registration number and go through the established
// auto-create/dedup flow (InvoiceTradeNetworkService).
@Controller()
export class InvoiceIntakeController {
  private readonly logger = new Logger(InvoiceIntakeController.name);

  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly processedEventRepository: ProcessedEventRepository,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  @EventPattern(KafkaTopicEnum.INVOICE_EXTRACTION_VALIDATED)
  async handleValidatedInvoice(
    @Payload() event: InvoiceExtractionValidatedEvent,
  ): Promise<void> {
    if (await this.processedEventRepository.exists(event.eventId)) {
      this.logger.warn(
        `Skipping already-processed INVOICE_EXTRACTION_VALIDATED event: ${event.eventId}`,
      );
      return;
    }

    const dto = new CreateInvoiceDto();
    dto.invoiceNumber = event.invoice.invoiceNumber;
    dto.documentCurrencyCode = event.invoice
      .documentCurrencyCode as CurrencyCodeEnum;
    dto.issueDate = event.invoice.issueDate;
    dto.dueDate = event.invoice.dueDate;
    dto.sourceDocumentReference = event.documentUuid;
    dto.newIssuerOrganization = {
      organizationName: event.invoice.issuerName,
      businessRegistrationNumber:
        event.invoice.issuerRegistrationNumber ?? undefined,
    };
    dto.newDebtorOrganization = {
      organizationName: event.invoice.debtorName,
      businessRegistrationNumber:
        event.invoice.debtorRegistrationNumber ?? undefined,
    };
    dto.lines = event.invoice.lines.map((line) => ({
      itemName: line.itemName,
      invoicedQuantity: line.invoicedQuantity,
      invoicedQuantityUnitCode: 'EA',
      priceAmount: line.priceAmount,
      taxPercent: line.taxPercent,
      taxSchemeId: 'VAT',
    })) as CreateInvoiceDto['lines'];

    try {
      const invoice = await this.invoiceService.create(
        { id: event.uploadedByPersonId ?? 0, orgId: event.uploaderOrgId },
        dto,
      );
      this.logger.log(
        `Created invoice ${invoice.invoiceNumber ?? dto.invoiceNumber} from extracted document ${event.documentUuid}`,
      );
    } catch (error) {
      // Recording the event as processed even on failure prevents a poison
      // message from blocking the consumer; the failure is logged for ops.
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to create invoice from document ${event.documentUuid}: ${message}`,
      );
    }

    await this.entityManager.transaction(async (manager) => {
      await this.processedEventRepository.record(manager, {
        id: event.eventId,
        topic: KafkaTopicEnum.INVOICE_EXTRACTION_VALIDATED,
      });
    });
  }
}
