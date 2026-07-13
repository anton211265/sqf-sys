import { TaxCategoryEnum } from '@app/common/apps/trade-directory/enums/tax-category.enum';
import { CurrencyCodeEnum } from '@app/common/constants/currencies';
import { AbstractEntity } from '@app/common/database/abstract.entity';
import { NumericTransformer } from '@app/common/utils/numeric-transformer';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';
import { Invoice } from './invoice.entity';

// Tax breakdown by category/rate at the invoice level (cac:TaxTotal/cac:TaxSubtotal).
@Entity()
export class InvoiceTaxSubtotal extends AbstractEntity<InvoiceTaxSubtotal> {
  @ManyToOne(() => Invoice, (invoice) => invoice.taxSubtotals, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoiceId' })
  invoice?: Invoice;

  @RelationId((subtotal: InvoiceTaxSubtotal) => subtotal.invoice)
  @Index()
  @Column({ type: 'integer' })
  invoiceId: number;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    transformer: new NumericTransformer(),
  })
  taxableAmount: number;

  @Column({
    type: 'enum',
    enum: CurrencyCodeEnum,
    enumName: 'CurrencyCodeEnum',
  })
  taxableAmountCurrencyCode: CurrencyCodeEnum;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    transformer: new NumericTransformer(),
  })
  taxAmount: number;

  @Column({
    type: 'enum',
    enum: CurrencyCodeEnum,
    enumName: 'CurrencyCodeEnum',
  })
  taxAmountCurrencyCode: CurrencyCodeEnum;

  @Column({
    type: 'enum',
    enum: TaxCategoryEnum,
    enumName: 'TaxCategoryEnum',
  })
  taxCategoryId: TaxCategoryEnum;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: new NumericTransformer(),
  })
  taxPercent?: number;

  @Column({ type: 'varchar', default: 'VAT' })
  taxSchemeId: string;

  @Column({ type: 'varchar', nullable: true })
  taxExemptionReason?: string;
}
