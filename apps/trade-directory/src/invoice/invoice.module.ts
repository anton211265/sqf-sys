import { DatabaseModule } from '@app/common/database/database.module';
import { OutboxEvent } from '@app/common/database/outbox-event.entity';
import { Module } from '@nestjs/common';
import {
  BuyerPersona,
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
  SupplierPersona,
} from '../models';
import {
  InvoiceRepository,
  OrganizationRepository,
  OutboxEventRepository,
  PartyRepository,
} from '../repositories';
import { InvoiceController } from './invoice.controller';
import { InvoiceTradeNetworkService } from './invoice-trade-network.service';
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
      SupplierPersona,
      BuyerPersona,
      OutboxEvent,
    ]),
  ],
  controllers: [InvoiceController],
  providers: [
    InvoiceService,
    InvoiceTradeNetworkService,
    InvoiceRepository,
    PartyRepository,
    OrganizationRepository,
    OutboxEventRepository,
  ],
  exports: [InvoiceService],
})
export class InvoiceModule {}
