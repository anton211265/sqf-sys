import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';

/**
 * Second-filter risk profile assigned to a product (one per product).
 * riskProfileCode is a bare reference to a risk-operation profile — no
 * cross-DB FK per the house rule; the CO flow resolves it at use time.
 */
@Entity('product_risk_filter_assignment')
@Unique(['productId'])
export class ProductRiskFilterAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  funderOrganizationId: number;

  @Column({ type: 'integer' })
  productId: number;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'varchar', length: 80 })
  riskProfileCode: string;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'LOCALTIMESTAMP' })
  updatedAt: Date;
}
