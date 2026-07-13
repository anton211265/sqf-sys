import { InvoiceStatusEnum } from '@app/common/apps/trade-directory/enums/invoice-status.enum';
import { LendingProductEnum } from '@app/common/apps/trade-directory/enums/lending-product.enum';
import { CurrencyCodeEnum } from '@app/common/constants/currencies';
import { AbstractEntity } from '@app/common/database/abstract.entity';
import { NumericTransformer } from '@app/common/utils/numeric-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Contract } from './contract.entity';
import { Organization } from './organization.entity';
import { Relationship } from './relationship.entity';

// The financial instrument at the centre of every lending-product flow.
// issuer = supplier side (raised the invoice), debtor = buyer side (owes it).
// Who uploads depends on the product: AR/IF -> the client (issuer side),
// SCF -> the buyer (debtor side) uploads approved payables.
// Access (future dynamic RBAC): CLIENT upload own, RELATIONSHIP_MANAGER +
// RISK_OFFICER manage/validate.
@Entity()
@Unique(['funderPersonaId', 'issuerOrganizationId', 'invoiceNumber'])
export class Invoice extends AbstractEntity<Invoice> {
  // Tenant scope.
  @Index()
  @Column({ type: 'integer' })
  funderPersonaId: number;

  @Column({ type: 'varchar' })
  invoiceNumber: string;

  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: 'issuerOrganizationId' })
  issuerOrganization?: Organization;

  @RelationId((invoice: Invoice) => invoice.issuerOrganization)
  @Column({ type: 'integer' })
  issuerOrganizationId: number;

  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: 'debtorOrganizationId' })
  debtorOrganization?: Organization;

  @RelationId((invoice: Invoice) => invoice.debtorOrganization)
  @Column({ type: 'integer' })
  debtorOrganizationId: number;

  @ManyToOne(() => Relationship, { nullable: true })
  @JoinColumn({ name: 'relationshipId' })
  relationship?: Relationship;

  @RelationId((invoice: Invoice) => invoice.relationship)
  @Column({ type: 'integer', nullable: true })
  relationshipId?: number;

  @ManyToOne(() => Contract, { nullable: true })
  @JoinColumn({ name: 'contractId' })
  contract?: Contract;

  @RelationId((invoice: Invoice) => invoice.contract)
  @Column({ type: 'integer', nullable: true })
  contractId?: number;

  // Which lending-product flow the invoice entered under.
  @Column({
    type: 'enum',
    enum: LendingProductEnum,
    enumName: 'LendingProductEnum',
    nullable: true,
  })
  lendingProduct?: LendingProductEnum;

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
  currency: CurrencyCodeEnum;

  @Column({ type: 'date' })
  issueDate: string;

  @Column({ type: 'date' })
  dueDate: string;

  @Index()
  @Column({
    type: 'enum',
    enum: InvoiceStatusEnum,
    enumName: 'InvoiceStatusEnum',
    default: InvoiceStatusEnum.UPLOADED,
  })
  status: InvoiceStatusEnum;

  @Column({ type: 'integer', nullable: true })
  uploadedByPersonId?: number;

  // document-management extraction requestId of the uploaded invoice document.
  @Column({ type: 'varchar', nullable: true })
  sourceDocumentReference?: string;

  // IF flow: when ownership of the receivable transferred to the funder.
  @Column({ type: 'timestamp without time zone', nullable: true })
  ownershipTransferredAt?: Date;

  @Column({ type: 'timestamp without time zone', nullable: true })
  settledAt?: Date;

  @CreateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
    onUpdate: 'LOCALTIMESTAMP',
  })
  updatedAt: Date;
}
