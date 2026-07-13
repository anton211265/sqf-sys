import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';
import { Invoice } from './invoice.entity';

// Free-text note on the invoice (cbc:Note is repeatable).
@Entity()
export class InvoiceNote extends AbstractEntity<InvoiceNote> {
  @ManyToOne(() => Invoice, (invoice) => invoice.notes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoiceId' })
  invoice?: Invoice;

  @RelationId((note: InvoiceNote) => note.invoice)
  @Index()
  @Column({ type: 'integer' })
  invoiceId: number;

  @Column({ type: 'smallint' })
  sequenceNo: number;

  @Column({ type: 'text' })
  noteText: string;
}
