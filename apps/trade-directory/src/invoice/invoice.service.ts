import { InvoiceStatusEnum } from '@app/common/apps/trade-directory/enums/invoice-status.enum';
import { LendingProductEnum } from '@app/common/apps/trade-directory/enums/lending-product.enum';
import { IUserContext } from '@app/common/apps/common/interface/user-context.interface';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Invoice } from '../models/invoice.entity';
import { InvoiceLine } from '../models/invoice-line.entity';
import { InvoiceLineTaxCategory } from '../models/invoice-line-tax-category.entity';
import { InvoiceTaxSubtotal } from '../models/invoice-tax-subtotal.entity';
import { Organization } from '../models/organization.entity';
import { Party } from '../models/party.entity';
import {
  InvoiceRepository,
  OrganizationRepository,
  OutboxEventRepository,
  PartyRepository,
} from '../repositories';
import {
  CreateInvoiceDto,
  CreateInvoiceLineDto,
  UpdateInvoiceStatusDto,
} from './dto/create-invoice.dto';

// Legal transitions of the invoice lifecycle, superset across the four
// lending-product flows (see InvoiceStatusEnum). Keep in sync with the enum.
const ALLOWED_TRANSITIONS: Record<InvoiceStatusEnum, InvoiceStatusEnum[]> = {
  [InvoiceStatusEnum.UPLOADED]: [
    InvoiceStatusEnum.VALIDATED,
    InvoiceStatusEnum.REJECTED,
  ],
  [InvoiceStatusEnum.VALIDATED]: [
    InvoiceStatusEnum.APPROVED_FOR_FINANCE,
    InvoiceStatusEnum.REJECTED,
  ],
  [InvoiceStatusEnum.APPROVED_FOR_FINANCE]: [
    InvoiceStatusEnum.PRESENTED, // SCF: present approved payables to supplier
    InvoiceStatusEnum.FINANCED,
    InvoiceStatusEnum.REJECTED,
  ],
  [InvoiceStatusEnum.PRESENTED]: [
    InvoiceStatusEnum.FINANCED, // supplier accepted early payment
    InvoiceStatusEnum.CLOSED, // supplier declined; invoice exits the flow
  ],
  [InvoiceStatusEnum.FINANCED]: [
    InvoiceStatusEnum.PARTIALLY_PAID,
    InvoiceStatusEnum.PAID,
    InvoiceStatusEnum.OVERDUE,
  ],
  [InvoiceStatusEnum.PARTIALLY_PAID]: [
    InvoiceStatusEnum.PAID,
    InvoiceStatusEnum.OVERDUE,
  ],
  [InvoiceStatusEnum.OVERDUE]: [
    InvoiceStatusEnum.PARTIALLY_PAID,
    InvoiceStatusEnum.PAID,
  ],
  [InvoiceStatusEnum.PAID]: [InvoiceStatusEnum.CLOSED],
  [InvoiceStatusEnum.CLOSED]: [],
  [InvoiceStatusEnum.REJECTED]: [],
};

const FULL_RELATIONS = [
  'issuerOrganization',
  'debtorOrganization',
  'relationship',
  'contract',
  'supplierParty',
  'customerParty',
  'lines',
  'lines.taxCategories',
  'taxSubtotals',
  'paymentMeans',
  'notes',
  'allowanceCharges',
];

// Rounds to 2 decimal places using integer cents to avoid float drift.
const round2 = (value: number): number => Math.round(value * 100) / 100;

@Injectable()
export class InvoiceService {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly partyRepository: PartyRepository,
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly entityManager: EntityManager,
  ) {}

  private async resolveFunderPersonaId(user: IUserContext): Promise<number> {
    const callerOrganization = await this.organizationRepository.findOne({
      where: { id: user.orgId },
    });
    if (!callerOrganization?.funderPersonaId) {
      throw new ForbiddenException(
        'Caller organization is not a funder organization',
      );
    }
    return callerOrganization.funderPersonaId;
  }

  // Immutable snapshot of an Organization's current details, captured onto
  // the invoice as its supplier/customer party — later edits to Organization
  // must never rewrite an already-issued document.
  private async snapshotPartyFromOrganization(
    manager: EntityManager,
    organization: Organization,
  ): Promise<Party> {
    const party = new Party({
      organizationId: organization.id,
      partyName: organization.alias ?? organization.organizationName,
      registrationName: organization.organizationName,
      companyId: organization.businessRegistrationNumber,
      vatNumber: organization.taxIdentificationNumber,
      countryCode: organization.country,
      streetName: organization.registeredAddress,
      postalZone: organization.postcode,
      countrySubentity: organization.malaysiaRegion
        ? String(organization.malaysiaRegion)
        : undefined,
      contactTelephone: organization.contactNumber,
      contactEmail: organization.emailAddress,
    });
    return manager.save(Party, party);
  }

  // Computes each line's net amount, the header LegalMonetaryTotal, and the
  // tax subtotals grouped by category/rate — callers submit lines only, never
  // totals, so stored totals can never drift from the lines that back them.
  private buildLinesAndTotals(
    dtoLines: CreateInvoiceLineDto[],
    documentCurrencyCode: string,
  ) {
    const lines: InvoiceLine[] = [];
    const taxGroups = new Map<
      string,
      { taxableAmount: number; taxAmount: number; taxCategoryId: string; taxPercent: number; taxSchemeId: string }
    >();
    let lineExtensionAmount = 0;

    dtoLines.forEach((dtoLine, index) => {
      const netAmount = round2(dtoLine.invoicedQuantity * dtoLine.priceAmount);
      lineExtensionAmount += netAmount;

      const taxCategoryId = dtoLine.taxCategoryId ?? 'S';
      const taxPercent = dtoLine.taxPercent ?? 0;
      const taxSchemeId = dtoLine.taxSchemeId ?? 'VAT';
      const groupKey = `${taxCategoryId}|${taxPercent}|${taxSchemeId}`;
      const group = taxGroups.get(groupKey) ?? {
        taxableAmount: 0,
        taxAmount: 0,
        taxCategoryId,
        taxPercent,
        taxSchemeId,
      };
      group.taxableAmount = round2(group.taxableAmount + netAmount);
      group.taxAmount = round2(group.taxAmount + netAmount * (taxPercent / 100));
      taxGroups.set(groupKey, group);

      lines.push(
        new InvoiceLine({
          lineNumber: String(index + 1),
          invoicedQuantity: dtoLine.invoicedQuantity,
          invoicedQuantityUnitCode: dtoLine.invoicedQuantityUnitCode ?? 'EA',
          lineExtensionAmount: netAmount,
          lineExtensionAmountCurrencyCode: documentCurrencyCode as any,
          itemName: dtoLine.itemName,
          itemDescription: dtoLine.itemDescription,
          priceAmount: dtoLine.priceAmount,
          priceAmountCurrencyCode: documentCurrencyCode as any,
          taxCategories: [
            new InvoiceLineTaxCategory({
              taxCategoryId: taxCategoryId as any,
              taxPercent,
              taxSchemeId,
            }),
          ],
        }),
      );
    });

    lineExtensionAmount = round2(lineExtensionAmount);
    const taxSubtotals = Array.from(taxGroups.values()).map(
      (group) =>
        new InvoiceTaxSubtotal({
          taxableAmount: group.taxableAmount,
          taxableAmountCurrencyCode: documentCurrencyCode as any,
          taxAmount: group.taxAmount,
          taxAmountCurrencyCode: documentCurrencyCode as any,
          taxCategoryId: group.taxCategoryId as any,
          taxPercent: group.taxPercent,
          taxSchemeId: group.taxSchemeId,
        }),
    );
    const totalTax = round2(
      taxSubtotals.reduce((sum, subtotal) => sum + subtotal.taxAmount, 0),
    );
    const taxExclusiveAmount = lineExtensionAmount;
    const taxInclusiveAmount = round2(taxExclusiveAmount + totalTax);

    return {
      lines,
      taxSubtotals,
      lineExtensionAmount,
      taxExclusiveAmount,
      taxInclusiveAmount,
      payableAmount: taxInclusiveAmount,
    };
  }

  async create(user: IUserContext, dto: CreateInvoiceDto) {
    const funderPersonaId = await this.resolveFunderPersonaId(user);

    if (dto.issuerOrganizationId === dto.debtorOrganizationId) {
      throw new BadRequestException(
        'issuerOrganizationId and debtorOrganizationId must differ',
      );
    }

    const duplicate = await this.invoiceRepository.findOne({
      where: {
        funderPersonaId,
        issuerOrganizationId: dto.issuerOrganizationId,
        invoiceNumber: dto.invoiceNumber,
      },
    });
    if (duplicate) {
      throw new ConflictException(
        `Invoice ${dto.invoiceNumber} already exists for this issuer`,
      );
    }

    const [issuerOrganization, debtorOrganization] = await Promise.all([
      this.organizationRepository.findOneOrThrowException({
        where: { id: dto.issuerOrganizationId },
      }),
      this.organizationRepository.findOneOrThrowException({
        where: { id: dto.debtorOrganizationId },
      }),
    ]);

    const {
      lines,
      taxSubtotals,
      lineExtensionAmount,
      taxExclusiveAmount,
      taxInclusiveAmount,
      payableAmount,
    } = this.buildLinesAndTotals(dto.lines, dto.documentCurrencyCode);

    return this.entityManager.transaction(async (manager) => {
      const [supplierParty, customerParty] = await Promise.all([
        this.snapshotPartyFromOrganization(manager, issuerOrganization),
        this.snapshotPartyFromOrganization(manager, debtorOrganization),
      ]);

      const invoice = new Invoice({
        funderPersonaId,
        invoiceNumber: dto.invoiceNumber,
        issuerOrganizationId: dto.issuerOrganizationId,
        debtorOrganizationId: dto.debtorOrganizationId,
        relationshipId: dto.relationshipId,
        contractId: dto.contractId,
        lendingProduct: dto.lendingProduct,
        invoiceTypeCode: dto.invoiceTypeCode,
        documentCurrencyCode: dto.documentCurrencyCode,
        issueDate: dto.issueDate,
        dueDate: dto.dueDate,
        buyerReference: dto.buyerReference,
        sourceDocumentReference: dto.sourceDocumentReference,
        supplierPartyId: supplierParty.id,
        customerPartyId: customerParty.id,
        lineExtensionAmount,
        taxExclusiveAmount,
        taxInclusiveAmount,
        payableAmount,
        lines,
        taxSubtotals,
        status: InvoiceStatusEnum.UPLOADED,
        uploadedByPersonId: user.id,
      });

      const saved = await manager.save(Invoice, invoice);
      await this.recordStatusEvent(manager, saved, null);
      return saved;
    });
  }

  async findAll(
    user: IUserContext,
    filters: {
      status?: string;
      issuerOrganizationId?: number;
      debtorOrganizationId?: number;
      relationshipId?: number;
    },
  ) {
    const funderPersonaId = await this.resolveFunderPersonaId(user);
    const where: Record<string, unknown> = { funderPersonaId };
    if (filters.status) where.status = filters.status;
    if (filters.issuerOrganizationId)
      where.issuerOrganizationId = filters.issuerOrganizationId;
    if (filters.debtorOrganizationId)
      where.debtorOrganizationId = filters.debtorOrganizationId;
    if (filters.relationshipId) where.relationshipId = filters.relationshipId;

    return this.invoiceRepository.find({
      where,
      relations: ['issuerOrganization', 'debtorOrganization'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findById(user: IUserContext, id: number) {
    const funderPersonaId = await this.resolveFunderPersonaId(user);
    const invoice = await this.invoiceRepository.findOne({
      where: { id, funderPersonaId },
      relations: FULL_RELATIONS,
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }
    return invoice;
  }

  async updateStatus(
    user: IUserContext,
    id: number,
    dto: UpdateInvoiceStatusDto,
  ) {
    const invoice = await this.findById(user, id);
    const from = invoice.status;
    const to = dto.status;

    if (!ALLOWED_TRANSITIONS[from].includes(to)) {
      throw new BadRequestException(
        `Illegal invoice status transition ${from} -> ${to}. Allowed: ${
          ALLOWED_TRANSITIONS[from].join(', ') || '(none — terminal state)'
        }`,
      );
    }

    invoice.status = to;
    if (to === InvoiceStatusEnum.PAID) {
      invoice.settledAt = new Date();
    }
    if (
      to === InvoiceStatusEnum.FINANCED &&
      invoice.lendingProduct === LendingProductEnum.INVOICE_FACTORING
    ) {
      // IF flow step 5: ownership of the receivable transfers to the funder.
      invoice.ownershipTransferredAt = new Date();
    }

    return this.entityManager.transaction(async (manager) => {
      const saved = await manager.save(Invoice, invoice);
      await this.recordStatusEvent(manager, saved, from);
      return saved;
    });
  }

  private async recordStatusEvent(
    manager: EntityManager,
    invoice: Invoice,
    previousStatus: InvoiceStatusEnum | null,
  ) {
    // Slim payload for downstream consumers (knowledge-graph) — avoid
    // spreading the full nested entity (lines/tax/parties) into Kafka.
    await this.outboxEventRepository.record(manager, {
      id: uuid(),
      topic: KafkaTopicEnum.INVOICE_STATUS_CHANGED,
      payload: {
        eventId: uuid(),
        previousStatus,
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        funderPersonaId: invoice.funderPersonaId,
        issuerOrganizationId: invoice.issuerOrganizationId,
        debtorOrganizationId: invoice.debtorOrganizationId,
        lendingProduct: invoice.lendingProduct ?? null,
        payableAmount: invoice.payableAmount,
        documentCurrencyCode: invoice.documentCurrencyCode,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        status: invoice.status,
      },
    });
  }
}
