import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { ConfigAuditService } from '../audit/config-audit.service';
import { CreateAssignmentDto } from '../dtos';
import { ClientProductAssignment } from '../models/client-product-assignment.entity';
import {
  MasterRateCard,
  RateCardStatusEnum,
} from '../models/master-rate-card.entity';
import { LegalDocumentTemplate } from '../models/legal-document-template.entity';
import { Product } from '../models/product.entity';
import {
  funderScope,
  ProductsService,
  UserContext,
} from '../products/products.service';
import { OutboxEventRepository } from '../repositories/outbox-event.repository';
import { renderTemplate } from './template-renderer';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(ClientProductAssignment)
    private readonly assignmentRepository: Repository<ClientProductAssignment>,
    @InjectRepository(LegalDocumentTemplate)
    private readonly templateRepository: Repository<LegalDocumentTemplate>,
    private readonly productsService: ProductsService,
    private readonly auditService: ConfigAuditService,
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly dataSource: DataSource,
  ) {}

  async list(
    user: UserContext,
    organizationId?: number,
  ): Promise<ClientProductAssignment[]> {
    return this.assignmentRepository.find({
      where: {
        ...funderScope(user.orgId),
        ...(organizationId ? { organizationId } : {}),
      },
      relations: ['product'],
      order: { id: 'ASC' },
    });
  }

  /**
   * The Snapshotted Assignment Pattern (spec core rule 1): copy the
   * currently PUBLISHED master rate card into a standalone assignment row.
   * Called manually for now; the automated "client status → active"
   * trigger arrives with the Product Approval flow (Kafka consumer, same
   * code path).
   */
  async create(
    user: UserContext,
    dto: CreateAssignmentDto,
  ): Promise<ClientProductAssignment> {
    const product = await this.productsService.getOwn(user, dto.productId);
    if (!product.isActive) {
      throw new BadRequestException('Product is not active');
    }
    if (
      product.isCustomBespoke &&
      product.clientOwnerOrganizationId !== dto.organizationId
    ) {
      throw new BadRequestException(
        'This bespoke product is restricted to its owning client',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const published = await manager.findOne(MasterRateCard, {
        where: {
          productId: dto.productId,
          status: RateCardStatusEnum.PUBLISHED,
        },
      });
      if (!published) {
        throw new BadRequestException(
          'Product has no PUBLISHED rate card to snapshot',
        );
      }
      if (published.interestRateApr === null) {
        throw new BadRequestException(
          'Published rate card has no interest rate — cannot assign',
        );
      }
      const assignment = await manager.save(ClientProductAssignment, {
        organizationId: dto.organizationId,
        productId: dto.productId,
        funderOrganizationId: product.funderOrganizationId,
        sourceRateCardId: published.id,
        sourceVersionNumber: published.versionNumber,
        assignedInterestRate: published.interestRateApr,
        assignedAdvanceRate: published.advanceRatePct,
        assignedDiscountFee: published.discountFeePct,
        assignedAdminFee: published.oneTimeAdminFee,
        assignedReservePct: published.reserveRetainPct,
        tenureDaysLimit: published.maxTenureDays,
      });
      await this.auditService.record(manager, {
        targetTable: 'client_product_assignment',
        entityId: assignment.id,
        productId: dto.productId,
        actorPersonId: user.id,
        actionPerformed: 'CREATE',
        newValues: {
          organizationId: dto.organizationId,
          sourceRateCardId: published.id,
          sourceVersionNumber: published.versionNumber,
        },
        changeReason: dto.changeReason,
        funderOrganizationId: product.funderOrganizationId,
      });
      await this.outboxEventRepository.record(manager, {
        id: randomUUID(),
        topic: KafkaTopicEnum.PRODUCT_ASSIGNMENT_CREATED,
        payload: {
          eventId: randomUUID(),
          assignmentId: assignment.id,
          organizationId: dto.organizationId,
          productId: dto.productId,
          productCode: product.productCode,
          funderOrganizationId: product.funderOrganizationId,
        },
      });
      return assignment;
    });
  }

  /** Handlebars Variable Injection Previewer (blueprint / spec §5.2). */
  async render(
    user: UserContext,
    assignmentId: number,
    templateId: number,
  ): Promise<{ rendered: string }> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId, ...funderScope(user.orgId) },
      relations: ['product'],
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    const template = await this.templateRepository.findOne({
      where: { id: templateId, ...funderScope(user.orgId) },
    });
    if (!template) throw new NotFoundException('Template not found');
    if (!template.templateBody) {
      throw new BadRequestException(
        'Template has no inline body to render (file-based rendering is a later phase)',
      );
    }
    const rendered = renderTemplate(template.templateBody, {
      currentDate: new Date().toISOString().slice(0, 10),
      assignment_id: assignment.id,
      organization_id: assignment.organizationId,
      product_code: assignment.product.productCode,
      product_name: assignment.product.productName,
      assigned_interest_rate: assignment.assignedInterestRate,
      assigned_advance_rate: assignment.assignedAdvanceRate,
      assigned_discount_fee: assignment.assignedDiscountFee,
      assigned_admin_fee: assignment.assignedAdminFee,
      assigned_reserve_pct: assignment.assignedReservePct,
      tenure_days_limit: assignment.tenureDaysLimit,
    });
    return { rendered };
  }
}
