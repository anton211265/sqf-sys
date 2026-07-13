import { DatabaseModule } from '@app/common/database/database.module';
import { OutboxEvent } from '@app/common/database/outbox-event.entity';
import { Module } from '@nestjs/common';
import { Contract, Invoice, Organization, Relationship } from '../models';
import {
  InvoiceRepository,
  OrganizationRepository,
  OutboxEventRepository,
} from '../repositories';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';

@Module({
  imports: [
    DatabaseModule.forFeature([
      Invoice,
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
    OrganizationRepository,
    OutboxEventRepository,
  ],
  exports: [InvoiceService],
})
export class InvoiceModule {}
