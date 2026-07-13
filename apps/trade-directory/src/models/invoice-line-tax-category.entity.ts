import { TaxCategoryEnum } from '@app/common/apps/trade-directory/enums/tax-category.enum';
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
import { InvoiceLine } from './invoice-line.entity';

// Tax category/rate applicable to a line's item (cac:Item/cac:ClassifiedTaxCategory).
@Entity()
export class InvoiceLineTaxCategory extends AbstractEntity<InvoiceLineTaxCategory> {
  @ManyToOne(() => InvoiceLine, (line) => line.taxCategories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoiceLineId' })
  invoiceLine?: InvoiceLine;

  @RelationId(
    (taxCategory: InvoiceLineTaxCategory) => taxCategory.invoiceLine,
  )
  @Index()
  @Column({ type: 'integer' })
  invoiceLineId: number;

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
}
