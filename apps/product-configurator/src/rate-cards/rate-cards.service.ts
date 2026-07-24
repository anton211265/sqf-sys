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
import { RateCardFieldsDto } from '../dtos';
import {
  MasterRateCard,
  RateCardStatusEnum,
} from '../models/master-rate-card.entity';
import { Product } from '../models/product.entity';
import { ProductsService, UserContext } from '../products/products.service';
import { OutboxEventRepository } from '../repositories/outbox-event.repository';
import { validateRateCardRules } from './rate-card-rules';

@Injectable()
export class RateCardsService {
  constructor(
    @InjectRepository(MasterRateCard)
    private readonly rateCardRepository: Repository<MasterRateCard>,
    private readonly productsService: ProductsService,
    private readonly auditService: ConfigAuditService,
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly dataSource: DataSource,
  ) {}

  async listForProduct(
    user: UserContext,
    productId: number,
  ): Promise<MasterRateCard[]> {
    await this.productsService.getOwn(user, productId); // 404s cross-org
    return this.rateCardRepository.find({
      where: { productId },
      order: { versionNumber: 'DESC' },
    });
  }

  async createDraft(
    user: UserContext,
    productId: number,
    dto: RateCardFieldsDto,
  ): Promise<MasterRateCard> {
    const product = await this.productsService.getOwn(user, productId);
    validateRateCardRules(product.productCode, dto);

    return this.dataSource.transaction(async (manager) => {
      const latest = await manager.findOne(MasterRateCard, {
        where: { productId },
        order: { versionNumber: 'DESC' },
      });
      const rateCard = await manager.save(MasterRateCard, {
        productId,
        versionNumber: (latest?.versionNumber ?? 0) + 1,
        status: RateCardStatusEnum.DRAFT,
        minTenureDays: dto.minTenureDays ?? 30,
        maxTenureDays: dto.maxTenureDays ?? 360,
        interestRateApr:
          dto.interestRateApr !== undefined ? String(dto.interestRateApr) : null,
        advanceRatePct:
          dto.advanceRatePct !== undefined ? String(dto.advanceRatePct) : null,
        discountFeePct:
          dto.discountFeePct !== undefined ? String(dto.discountFeePct) : null,
        oneTimeAdminFee: String(dto.oneTimeAdminFee ?? 0),
        reserveRetainPct: String(dto.reserveRetainPct ?? 0),
        formulaType: dto.formulaType ?? null,
        customVariables: dto.customVariables ?? null,
        configuredByAgent: dto.configuredByAgent ?? false,
      });
      await this.auditService.record(manager, {
        targetTable: 'master_rate_card',
        entityId: rateCard.id,
        productId,
        actorPersonId: user.id,
        actionPerformed: 'CREATE',
        newValues: { versionNumber: rateCard.versionNumber, ...dto },
        changeReason: dto.changeReason,
        funderOrganizationId: product.funderOrganizationId,
      });
      return rateCard;
    });
  }

  async updateDraft(
    user: UserContext,
    id: number,
    dto: RateCardFieldsDto,
  ): Promise<MasterRateCard> {
    return this.dataSource.transaction(async (manager) => {
      const rateCard = await manager.findOne(MasterRateCard, {
        where: { id },
        relations: ['product'],
      });
      if (
        !rateCard ||
        (user.orgId !== 0 &&
          rateCard.product.funderOrganizationId !== user.orgId)
      ) {
        throw new NotFoundException('Rate card not found');
      }
      if (rateCard.status !== RateCardStatusEnum.DRAFT) {
        throw new BadRequestException(
          `Only DRAFT rate cards can be edited (this one is ${rateCard.status}) — create a new version instead`,
        );
      }
      validateRateCardRules(rateCard.product.productCode, dto, rateCard);

      const oldValues = this.snapshot(rateCard);
      if (dto.minTenureDays !== undefined)
        rateCard.minTenureDays = dto.minTenureDays;
      if (dto.maxTenureDays !== undefined)
        rateCard.maxTenureDays = dto.maxTenureDays;
      if (dto.interestRateApr !== undefined)
        rateCard.interestRateApr = String(dto.interestRateApr);
      if (dto.advanceRatePct !== undefined)
        rateCard.advanceRatePct = String(dto.advanceRatePct);
      if (dto.discountFeePct !== undefined)
        rateCard.discountFeePct = String(dto.discountFeePct);
      if (dto.oneTimeAdminFee !== undefined)
        rateCard.oneTimeAdminFee = String(dto.oneTimeAdminFee);
      if (dto.reserveRetainPct !== undefined)
        rateCard.reserveRetainPct = String(dto.reserveRetainPct);
      if (dto.formulaType !== undefined) rateCard.formulaType = dto.formulaType;
      if (dto.customVariables !== undefined)
        rateCard.customVariables = dto.customVariables;
      const saved = await manager.save(MasterRateCard, rateCard);

      await this.auditService.record(manager, {
        targetTable: 'master_rate_card',
        entityId: id,
        productId: rateCard.productId,
        actorPersonId: user.id,
        actionPerformed: 'UPDATE',
        oldValues,
        newValues: this.snapshot(saved),
        changeReason: dto.changeReason,
        funderOrganizationId: rateCard.product.funderOrganizationId,
      });
      return saved;
    });
  }

  /**
   * DRAFT → PUBLISHED. Exactly one PUBLISHED version per product: the
   * previously published version is ARCHIVED in the same transaction
   * (blueprint: "safe archiving of older models without disrupting active
   * agreements" — existing assignments are snapshots and never change).
   */
  async publish(user: UserContext, id: number): Promise<MasterRateCard> {
    return this.dataSource.transaction(async (manager) => {
      const rateCard = await manager.findOne(MasterRateCard, {
        where: { id },
        relations: ['product'],
      });
      if (
        !rateCard ||
        (user.orgId !== 0 &&
          rateCard.product.funderOrganizationId !== user.orgId)
      ) {
        throw new NotFoundException('Rate card not found');
      }
      if (rateCard.status !== RateCardStatusEnum.DRAFT) {
        throw new BadRequestException(
          `Only DRAFT rate cards can be published (this one is ${rateCard.status})`,
        );
      }

      const current = await manager.findOne(MasterRateCard, {
        where: {
          productId: rateCard.productId,
          status: RateCardStatusEnum.PUBLISHED,
        },
      });
      if (current) {
        current.status = RateCardStatusEnum.ARCHIVED;
        await manager.save(MasterRateCard, current);
        await this.auditService.record(manager, {
          targetTable: 'master_rate_card',
          entityId: current.id,
          productId: rateCard.productId,
          actorPersonId: user.id,
          actionPerformed: 'ARCHIVE',
          oldValues: { status: RateCardStatusEnum.PUBLISHED },
          newValues: { status: RateCardStatusEnum.ARCHIVED },
          funderOrganizationId: rateCard.product.funderOrganizationId,
        });
      }

      rateCard.status = RateCardStatusEnum.PUBLISHED;
      rateCard.publishedAt = new Date();
      const saved = await manager.save(MasterRateCard, rateCard);

      await this.auditService.record(manager, {
        targetTable: 'master_rate_card',
        entityId: id,
        productId: rateCard.productId,
        actorPersonId: user.id,
        actionPerformed: 'PUBLISH',
        oldValues: { status: RateCardStatusEnum.DRAFT },
        newValues: {
          status: RateCardStatusEnum.PUBLISHED,
          versionNumber: rateCard.versionNumber,
        },
        funderOrganizationId: rateCard.product.funderOrganizationId,
      });
      await this.outboxEventRepository.record(manager, {
        id: randomUUID(),
        topic: KafkaTopicEnum.RATE_CARD_PUBLISHED,
        payload: {
          eventId: randomUUID(),
          rateCardId: saved.id,
          productId: rateCard.productId,
          productCode: rateCard.product.productCode,
          versionNumber: saved.versionNumber,
          funderOrganizationId: rateCard.product.funderOrganizationId,
          // Card parameters (2026-07-24, add-only): consumed by
          // risk-operation's rate_card_mirror for provisional-offer
          // simulator defaults. Fractions, as stored.
          params: {
            interestRateApr: saved.interestRateApr,
            advanceRatePct: saved.advanceRatePct,
            discountFeePct: saved.discountFeePct,
            oneTimeAdminFee: saved.oneTimeAdminFee,
            reserveRetainPct: saved.reserveRetainPct,
            minTenureDays: saved.minTenureDays,
            maxTenureDays: saved.maxTenureDays,
          },
        },
      });
      return saved;
    });
  }

  private snapshot(rateCard: MasterRateCard): Record<string, unknown> {
    return {
      minTenureDays: rateCard.minTenureDays,
      maxTenureDays: rateCard.maxTenureDays,
      interestRateApr: rateCard.interestRateApr,
      advanceRatePct: rateCard.advanceRatePct,
      discountFeePct: rateCard.discountFeePct,
      oneTimeAdminFee: rateCard.oneTimeAdminFee,
      reserveRetainPct: rateCard.reserveRetainPct,
      formulaType: rateCard.formulaType,
      customVariables: rateCard.customVariables,
    };
  }
}
