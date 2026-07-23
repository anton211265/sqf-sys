import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export enum ProductStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/**
 * Product registry (spec: product_configurator.md §3 "products").
 * Adaptations from the spec, agreed at build time:
 * - surrogate int id + UNIQUE(funderOrganizationId, productCode) instead of
 *   a global VARCHAR product_id PK — the shared dev DB holds several funders,
 *   each of which needs its own 'AR'/'SCF'/'IF'/'TL' rows.
 * - clientOwnerOrganizationId is a bare trade-directory organization id
 *   (house rule: no local client registry, no cross-DB FK).
 */
@Entity('product')
@Unique('UQ_product_funder_code', ['funderOrganizationId', 'productCode'])
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 10 })
  productCode: string;

  @Column({ type: 'varchar', length: 100 })
  productName: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: false })
  isCustomBespoke: boolean;

  @Column({ type: 'integer', nullable: true })
  clientOwnerOrganizationId: number | null;

  @Column({ type: 'integer' })
  funderOrganizationId: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'LOCALTIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'LOCALTIMESTAMP' })
  updatedAt: Date;
}
