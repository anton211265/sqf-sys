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
import {
  InvoiceRepository,
  OrganizationRepository,
  OutboxEventRepository,
} from '../repositories';
import { CreateInvoiceDto, UpdateInvoiceStatusDto } from './dto/create-invoice.dto';

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

@Injectable()
export class InvoiceService {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly organizationRepository: OrganizationRepository,
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

    const invoice = new Invoice({
      ...dto,
      funderPersonaId,
      status: InvoiceStatusEnum.UPLOADED,
      uploadedByPersonId: user.id,
    });

    return this.entityManager.transaction(async (manager) => {
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
      relations: [
        'issuerOrganization',
        'debtorOrganization',
        'relationship',
        'contract',
      ],
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
    await this.outboxEventRepository.record(manager, {
      id: uuid(),
      topic: KafkaTopicEnum.INVOICE_STATUS_CHANGED,
      payload: { eventId: uuid(), previousStatus, ...invoice },
    });
  }
}
