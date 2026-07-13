import { CurrencyCodeEnum } from '@app/common/constants/currencies';
import { AbstractEntity } from '@app/common/database/abstract.entity';
import { NumericTransformer } from '@app/common/utils/numeric-transformer';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  RelationId,
  Unique,
} from 'typeorm';
import { Invoice } from './invoice.entity';
import { InvoiceAllowanceCharge } from './invoice-allowance-charge.entity';
import { InvoiceLineAdditionalItemProperty } from './invoice-line-additional-item-property.entity';
import { InvoiceLineTaxCategory } from './invoice-line-tax-category.entity';

// One invoiced line item (cac:InvoiceLine).
@Entity()
@Unique(['invoiceId', 'lineNumber'])
export class InvoiceLine extends AbstractEntity<InvoiceLine> {
  @ManyToOne(() => Invoice, (invoice) => invoice.lines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoiceId' })
  invoice?: Invoice;

  @RelationId((line: InvoiceLine) => line.invoice)
  @Index()
  @Column({ type: 'integer' })
  invoiceId: number;

  @Column({ type: 'varchar' })
  lineNumber: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 4,
    transformer: new NumericTransformer(),
  })
  invoicedQuantity: number;

  // UN/ECE Recommendation 20 unit code, e.g. EA, HUR, KGM.
  @Column({ type: 'varchar' })
  invoicedQuantityUnitCode: string;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    transformer: new NumericTransformer(),
  })
  lineExtensionAmount: number;

  @Column({
    type: 'enum',
    enum: CurrencyCodeEnum,
    enumName: 'CurrencyCodeEnum',
  })
  lineExtensionAmountCurrencyCode: CurrencyCodeEnum;

  @Column({ type: 'varchar', nullable: true })
  accountingCost?: string;

  @Column({ type: 'date', nullable: true })
  invoicePeriodStart?: string;

  @Column({ type: 'date', nullable: true })
  invoicePeriodEnd?: string;

  @Column({ type: 'varchar', nullable: true })
  orderLineReferenceId?: string;

  @Column({ type: 'varchar' })
  itemName: string;

  @Column({ type: 'text', nullable: true })
  itemDescription?: string;

  @Column({ type: 'varchar', nullable: true })
  sellersItemId?: string;

  @Column({ type: 'varchar', nullable: true })
  standardItemId?: string;

  @Column({ type: 'varchar', nullable: true })
  standardItemIdSchemeId?: string;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 4,
    transformer: new NumericTransformer(),
  })
  priceAmount: number;

  @Column({
    type: 'enum',
    enum: CurrencyCodeEnum,
    enumName: 'CurrencyCodeEnum',
  })
  priceAmountCurrencyCode: CurrencyCodeEnum;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 4,
    nullable: true,
    transformer: new NumericTransformer(),
  })
  baseQuantity?: number;

  @Column({ type: 'varchar', nullable: true })
  baseQuantityUnitCode?: string;

  @OneToMany(
    () => InvoiceLineTaxCategory,
    (taxCategory) => taxCategory.invoiceLine,
    { cascade: true },
  )
  taxCategories?: InvoiceLineTaxCategory[];

  @OneToMany(
    () => InvoiceLineAdditionalItemProperty,
    (property) => property.invoiceLine,
    { cascade: true },
  )
  additionalItemProperties?: InvoiceLineAdditionalItemProperty[];

  @OneToMany(
    () => InvoiceAllowanceCharge,
    (allowanceCharge) => allowanceCharge.invoiceLine,
    { cascade: true },
  )
  allowanceCharges?: InvoiceAllowanceCharge[];
}
