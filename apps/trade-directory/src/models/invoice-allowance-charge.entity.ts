import { TaxCategoryEnum } from '@app/common/apps/trade-directory/enums/tax-category.enum';
import { CurrencyCodeEnum } from '@app/common/constants/currencies';
import { AbstractEntity } from '@app/common/database/abstract.entity';
import { NumericTransformer } from '@app/common/utils/numeric-transformer';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';
import { Invoice } from './invoice.entity';
import { InvoiceLine } from './invoice-line.entity';

// Document-level or line-level allowance (discount) or charge. Exactly one of
// invoiceId / invoiceLineId is set per row (cac:AllowanceCharge).
@Entity()
@Check(
  '"invoiceId_xor_invoiceLineId"',
  '(("invoiceId" IS NOT NULL)::int + ("invoiceLineId" IS NOT NULL)::int) = 1',
)
export class InvoiceAllowanceCharge extends AbstractEntity<InvoiceAllowanceCharge> {
  @ManyToOne(() => Invoice, (invoice) => invoice.allowanceCharges, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoiceId' })
  invoice?: Invoice;

  @RelationId((allowanceCharge: InvoiceAllowanceCharge) => allowanceCharge.invoice)
  @Index()
  @Column({ type: 'integer', nullable: true })
  invoiceId?: number;

  @ManyToOne(() => InvoiceLine, (line) => line.allowanceCharges, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoiceLineId' })
  invoiceLine?: InvoiceLine;

  @RelationId(
    (allowanceCharge: InvoiceAllowanceCharge) => allowanceCharge.invoiceLine,
  )
  @Index()
  @Column({ type: 'integer', nullable: true })
  invoiceLineId?: number;

  // true = charge, false = allowance/discount.
  @Column({ type: 'boolean' })
  chargeIndicator: boolean;

  @Column({ type: 'varchar', nullable: true })
  reasonCode?: string;

  @Column({ type: 'varchar', nullable: true })
  reason?: string;

  @Column({
    type: 'numeric',
    precision: 7,
    scale: 4,
    nullable: true,
    transformer: new NumericTransformer(),
  })
  multiplierFactorNumeric?: number;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    transformer: new NumericTransformer(),
  })
  amount: number;

  @Column({
    type: 'enum',
    enum: CurrencyCodeEnum,
    enumName: 'CurrencyCodeEnum',
  })
  amountCurrencyCode: CurrencyCodeEnum;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: new NumericTransformer(),
  })
  baseAmount?: number;

  @Column({
    type: 'enum',
    enum: CurrencyCodeEnum,
    enumName: 'CurrencyCodeEnum',
    nullable: true,
  })
  baseAmountCurrencyCode?: CurrencyCodeEnum;

  @Column({
    type: 'enum',
    enum: TaxCategoryEnum,
    enumName: 'TaxCategoryEnum',
    nullable: true,
  })
  taxCategoryId?: TaxCategoryEnum;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: new NumericTransformer(),
  })
  taxPercent?: number;

  @Column({ type: 'varchar', nullable: true })
  taxSchemeId?: string;
}
