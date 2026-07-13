import { DatabaseModule } from '@app/common/database/database.module';
import { OutboxEvent } from '@app/common/database/outbox-event.entity';
import { Module } from '@nestjs/common';
import {
  Contract,
  Invoice,
  InvoiceAdditionalDocumentReference,
  InvoiceAllowanceCharge,
  InvoiceLine,
  InvoiceLineAdditionalItemProperty,
  InvoiceLineTaxCategory,
  InvoiceNote,
  InvoicePaymentMeans,
  InvoiceTaxSubtotal,
  Organization,
  Party,
  Relationship,
} from '../models';
import {
  InvoiceRepository,
  OrganizationRepository,
  OutboxEventRepository,
  PartyRepository,
} from '../repositories';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';

@Module({
  imports: [
    DatabaseModule.forFeature([
      Invoice,
      InvoiceLine,
      InvoiceLineTaxCategory,
      InvoiceLineAdditionalItemProperty,
      InvoiceNote,
      InvoiceAdditionalDocumentReference,
      InvoicePaymentMeans,
      InvoiceTaxSubtotal,
      InvoiceAllowanceCharge,
      Party,
      Relationship,
      Contract,
      Organization,
      OutboxEvent,
    ]),
  ],
  controllers: [InvoiceController],
  providers: [
    InvoiceService,
    InvoiceRepository,
    PartyRepository,
    OrganizationRepository,
    OutboxEventRepository,
  ],
  exports: [InvoiceService],
})
export class InvoiceModule {}
