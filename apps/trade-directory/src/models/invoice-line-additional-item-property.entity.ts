import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';
import { InvoiceLine } from './invoice-line.entity';

// Extra named attributes describing a line's item (cac:Item/cac:AdditionalItemProperty).
@Entity()
export class InvoiceLineAdditionalItemProperty extends AbstractEntity<InvoiceLineAdditionalItemProperty> {
  @ManyToOne(() => InvoiceLine, (line) => line.additionalItemProperties, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoiceLineId' })
  invoiceLine?: InvoiceLine;

  @RelationId(
    (property: InvoiceLineAdditionalItemProperty) => property.invoiceLine,
  )
  @Index()
  @Column({ type: 'integer' })
  invoiceLineId: number;

  @Column({ type: 'varchar' })
  propertyName: string;

  @Column({ type: 'varchar', nullable: true })
  propertyValue?: string;
}
