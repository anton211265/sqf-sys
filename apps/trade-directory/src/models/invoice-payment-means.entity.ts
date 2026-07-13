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

// How payment is to be made (cac:PaymentMeans). UNCL4461 payment-means code,
// e.g. 30 = credit transfer, 58 = SEPA credit transfer, 49 = direct debit.
@Entity()
export class InvoicePaymentMeans extends AbstractEntity<InvoicePaymentMeans> {
  @ManyToOne(() => Invoice, (invoice) => invoice.paymentMeans, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoiceId' })
  invoice?: Invoice;

  @RelationId((paymentMeans: InvoicePaymentMeans) => paymentMeans.invoice)
  @Index()
  @Column({ type: 'integer' })
  invoiceId: number;

  @Column({ type: 'varchar' })
  paymentMeansCode: string;

  @Column({ type: 'date', nullable: true })
  paymentDueDate?: string;

  @Column({ type: 'varchar', nullable: true })
  paymentId?: string;

  @Column({ type: 'varchar', nullable: true })
  payeeAccountId?: string;

  @Column({ type: 'varchar', nullable: true })
  payeeAccountName?: string;

  @Column({ type: 'varchar', nullable: true })
  financialInstitutionId?: string;

  @Column({ type: 'varchar', nullable: true })
  financialInstitutionName?: string;
}
