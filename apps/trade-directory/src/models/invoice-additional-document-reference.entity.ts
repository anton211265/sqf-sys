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

// Supporting document/attachment referenced by the invoice (cac:AdditionalDocumentReference).
@Entity()
export class InvoiceAdditionalDocumentReference extends AbstractEntity<InvoiceAdditionalDocumentReference> {
  @ManyToOne(() => Invoice, (invoice) => invoice.additionalDocumentReferences, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoiceId' })
  invoice?: Invoice;

  @RelationId(
    (reference: InvoiceAdditionalDocumentReference) => reference.invoice,
  )
  @Index()
  @Column({ type: 'integer' })
  invoiceId: number;

  @Column({ type: 'varchar', nullable: true })
  documentId?: string;

  @Column({ type: 'varchar', nullable: true })
  documentType?: string;

  @Column({ type: 'varchar', nullable: true })
  attachmentMimeCode?: string;

  @Column({ type: 'varchar', nullable: true })
  attachmentFilename?: string;

  // Populated only when the attachment is embedded inline rather than
  // referenced externally (rare — most attachments live in document-management).
  @Column({ type: 'bytea', nullable: true })
  attachmentBinary?: Buffer;

  @Column({ type: 'varchar', nullable: true })
  externalReferenceUri?: string;
}
