import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { LegalDocumentTemplate } from './legal-document-template.entity';
import { Product } from './product.entity';

/** Product ↔ legal template bindings (spec §3 "product_document_mappings"). */
@Entity('product_document_mapping')
export class ProductDocumentMapping {
  @PrimaryColumn({ type: 'integer' })
  productId: number;

  @PrimaryColumn({ type: 'integer' })
  templateId: number;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => LegalDocumentTemplate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'templateId' })
  template: LegalDocumentTemplate;
}
