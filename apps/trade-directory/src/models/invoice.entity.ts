import { InvoiceStatusEnum } from '@app/common/apps/trade-directory/enums/invoice-status.enum';
import { InvoiceTypeCodeEnum } from '@app/common/apps/trade-directory/enums/invoice-type-code.enum';
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
  OneToMany,
  RelationId,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Contract } from './contract.entity';
import { InvoiceAdditionalDocumentReference } from './invoice-additional-document-reference.entity';
import { InvoiceAllowanceCharge } from './invoice-allowance-charge.entity';
import { InvoiceLine } from './invoice-line.entity';
import { InvoiceNote } from './invoice-note.entity';
import { InvoicePaymentMeans } from './invoice-payment-means.entity';
import { InvoiceTaxSubtotal } from './invoice-tax-subtotal.entity';
import { Organization } from './organization.entity';
import { Party } from './party.entity';
import { Relationship } from './relationship.entity';

// The financial instrument at the centre of every lending-product flow —
// header fields mirror the OASIS UBL 2.5 Invoice document (see
// SQF ARCHITECTURE/SCEHMA/ubl-invoice-*.{json,md}), extended with the SQF
// lending-workflow fields that have no UBL equivalent (funderPersonaId,
// lendingProduct, status machine, ownership/settlement timestamps).
//
// issuerOrganization/debtorOrganization are the SQF Organization the invoice
// is filed against (drive the relationship/contract graph and RBAC).
// supplierParty/customerParty are an immutable snapshot of that party's
// name/address/VAT as they appeared on THIS document (party.organizationId
// links back to the Organization when known) — a later edit to Organization
// must never rewrite an already-issued invoice.
//
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

  // ---------------- UBL header ----------------

  @Column({ type: 'varchar', nullable: true, default: '2.5' })
  ublVersionId?: string;

  @Column({ type: 'varchar', nullable: true })
  customizationId?: string;

  @Column({ type: 'varchar', nullable: true })
  profileId?: string;

  @Column({ type: 'varchar' })
  invoiceNumber: string;

  @Column({ type: 'date' })
  issueDate: string;

  @Column({ type: 'time', nullable: true })
  issueTime?: string;

  @Column({ type: 'date' })
  dueDate: string;

  @Column({
    type: 'enum',
    enum: InvoiceTypeCodeEnum,
    enumName: 'InvoiceTypeCodeEnum',
    default: InvoiceTypeCodeEnum.COMMERCIAL_INVOICE,
  })
  invoiceTypeCode: InvoiceTypeCodeEnum;

  @Column({ type: 'date', nullable: true })
  taxPointDate?: string;

  @Column({
    type: 'enum',
    enum: CurrencyCodeEnum,
    enumName: 'CurrencyCodeEnum',
  })
  documentCurrencyCode: CurrencyCodeEnum;

  @Column({
    type: 'enum',
    enum: CurrencyCodeEnum,
    enumName: 'CurrencyCodeEnum',
    nullable: true,
  })
  taxCurrencyCode?: CurrencyCodeEnum;

  @Column({ type: 'varchar', nullable: true })
  buyerReference?: string;

  @Column({ type: 'date', nullable: true })
  invoicePeriodStart?: string;

  @Column({ type: 'date', nullable: true })
  invoicePeriodEnd?: string;

  @Column({ type: 'varchar', nullable: true })
  orderReferenceId?: string;

  @Column({ type: 'varchar', nullable: true })
  salesOrderId?: string;

  // UBL cac:ContractDocumentReference — a free-text/document reference,
  // distinct from the SQF `contract` FK below which links a structured record.
  @Column({ type: 'varchar', nullable: true })
  contractDocumentReferenceId?: string;

  @Column({ type: 'varchar', nullable: true })
  projectReferenceId?: string;

  @Column({ type: 'date', nullable: true })
  deliveryActualDate?: string;

  @Column({ type: 'varchar', nullable: true })
  deliveryLocationId?: string;

  // ---------------- Parties ----------------

  @ManyToOne(() => Party, { nullable: false })
  @JoinColumn({ name: 'supplierPartyId' })
  supplierParty?: Party;

  @RelationId((invoice: Invoice) => invoice.supplierParty)
  @Column({ type: 'integer' })
  supplierPartyId: number;

  @ManyToOne(() => Party, { nullable: false })
  @JoinColumn({ name: 'customerPartyId' })
  customerParty?: Party;

  @RelationId((invoice: Invoice) => invoice.customerParty)
  @Column({ type: 'integer' })
  customerPartyId: number;

  @ManyToOne(() => Party, { nullable: true })
  @JoinColumn({ name: 'payeePartyId' })
  payeeParty?: Party;

  @RelationId((invoice: Invoice) => invoice.payeeParty)
  @Column({ type: 'integer', nullable: true })
  payeePartyId?: number;

  @ManyToOne(() => Party, { nullable: true })
  @JoinColumn({ name: 'taxRepresentativePartyId' })
  taxRepresentativeParty?: Party;

  @RelationId((invoice: Invoice) => invoice.taxRepresentativeParty)
  @Column({ type: 'integer', nullable: true })
  taxRepresentativePartyId?: number;

  // ---------------- Legal monetary total ----------------

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    transformer: new NumericTransformer(),
  })
  lineExtensionAmount: number;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    transformer: new NumericTransformer(),
  })
  taxExclusiveAmount: number;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    transformer: new NumericTransformer(),
  })
  taxInclusiveAmount: number;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: new NumericTransformer(),
  })
  allowanceTotalAmount?: number;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: new NumericTransformer(),
  })
  chargeTotalAmount?: number;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: new NumericTransformer(),
  })
  prepaidAmount?: number;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: new NumericTransformer(),
  })
  payableRoundingAmount?: number;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    transformer: new NumericTransformer(),
  })
  payableAmount: number;

  // ---------------- Children ----------------

  @OneToMany(() => InvoiceNote, (note) => note.invoice, { cascade: true })
  notes?: InvoiceNote[];

  @OneToMany(
    () => InvoiceAdditionalDocumentReference,
    (reference) => reference.invoice,
    { cascade: true },
  )
  additionalDocumentReferences?: InvoiceAdditionalDocumentReference[];

  @OneToMany(() => InvoicePaymentMeans, (paymentMeans) => paymentMeans.invoice, {
    cascade: true,
  })
  paymentMeans?: InvoicePaymentMeans[];

  @OneToMany(() => InvoiceTaxSubtotal, (subtotal) => subtotal.invoice, {
    cascade: true,
  })
  taxSubtotals?: InvoiceTaxSubtotal[];

  @OneToMany(
    () => InvoiceAllowanceCharge,
    (allowanceCharge) => allowanceCharge.invoice,
    { cascade: true },
  )
  allowanceCharges?: InvoiceAllowanceCharge[];

  @OneToMany(() => InvoiceLine, (line) => line.invoice, { cascade: true })
  lines?: InvoiceLine[];

  // ---------------- SQF lending workflow (no UBL equivalent) ----------------

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
