import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';

export enum AssignmentStatusEnum {
  ACTIVE = 'ACTIVE',
  TERMINATED = 'TERMINATED',
}

/**
 * Snapshotted client product assignment (spec §3
 * "client_product_assignments" + core rule 1, the Snapshotted Assignment
 * Pattern): a standalone copy of the PUBLISHED master rate card taken at
 * assignment time. Later master pricing changes never mutate these rows.
 * organizationId is the client's bare trade-directory organization id
 * (adaptation: the spec's local "clients" table is not carried over — house
 * rule, identity lives in trade-directory only). sourceRateCardId/
 * sourceVersionNumber record provenance without acting as live references.
 */
@Entity('client_product_assignment')
export class ClientProductAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  organizationId: number;

  @Column({ type: 'integer' })
  productId: number;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'integer' })
  funderOrganizationId: number;

  @Column({ type: 'integer', nullable: true })
  sourceRateCardId: number | null;

  @Column({ type: 'integer', nullable: true })
  sourceVersionNumber: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 4 })
  assignedInterestRate: string;

  @Column({ type: 'numeric', precision: 5, scale: 4, nullable: true })
  assignedAdvanceRate: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 4, nullable: true })
  assignedDiscountFee: string | null;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  assignedAdminFee: string;

  @Column({ type: 'numeric', precision: 5, scale: 4, nullable: true })
  assignedReservePct: string | null;

  @Column({ type: 'integer' })
  tenureDaysLimit: number;

  @Column({ type: 'varchar', default: AssignmentStatusEnum.ACTIVE })
  status: AssignmentStatusEnum;

  @CreateDateColumn({ type: 'timestamp', default: () => 'LOCALTIMESTAMP' })
  assignedAt: Date;
}
