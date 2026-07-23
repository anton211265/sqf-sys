import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigAuditService } from '../audit/config-audit.service';
import {
  CreateBespokeProductDto,
  CreateProductDto,
  UpdateProductDto,
} from '../dtos';
import {
  MasterRateCard,
  RateCardStatusEnum,
} from '../models/master-rate-card.entity';
import { Product } from '../models/product.entity';
import { validateRateCardRules } from '../rate-cards/rate-card-rules';

export interface UserContext {
  id: number;
  orgId: number;
}

/** SQFSYS (orgId 0) sees every funder's rows; everyone else only their own. */
export const funderScope = (orgId: number) =>
  orgId === 0 ? {} : { funderOrganizationId: orgId };

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly auditService: ConfigAuditService,
    private readonly dataSource: DataSource,
  ) {}

  async list(user: UserContext): Promise<Product[]> {
    return this.productRepository.find({
      where: funderScope(user.orgId),
      order: { id: 'ASC' },
    });
  }

  async getOwn(user: UserContext, id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id, ...funderScope(user.orgId) },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async createStandard(
    user: UserContext,
    dto: CreateProductDto,
  ): Promise<Product> {
    if (user.orgId === 0) {
      throw new BadRequestException(
        'Products belong to a funder organization — log in as a funder admin',
      );
    }
    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(Product, {
        where: {
          funderOrganizationId: user.orgId,
          productCode: dto.productCode,
        },
      });
      if (existing) {
        throw new BadRequestException(
          `Product code ${dto.productCode} already exists`,
        );
      }
      const product = await manager.save(Product, {
        productCode: dto.productCode,
        productName: dto.productName,
        description: dto.description ?? null,
        isCustomBespoke: false,
        clientOwnerOrganizationId: null,
        funderOrganizationId: user.orgId,
        isActive: true,
      });
      await this.auditService.record(manager, {
        targetTable: 'product',
        entityId: product.id,
        productId: product.id,
        actorPersonId: user.id,
        actionPerformed: 'CREATE',
        newValues: { ...dto },
        funderOrganizationId: user.orgId,
      });
      return product;
    });
  }

  async update(
    user: UserContext,
    id: number,
    dto: UpdateProductDto,
  ): Promise<Product> {
    return this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id, ...funderScope(user.orgId) },
      });
      if (!product) throw new NotFoundException('Product not found');

      const oldValues = {
        productName: product.productName,
        description: product.description,
        isActive: product.isActive,
      };
      if (dto.productName !== undefined) product.productName = dto.productName;
      if (dto.description !== undefined) product.description = dto.description;
      if (dto.isActive !== undefined) product.isActive = dto.isActive;
      const saved = await manager.save(Product, product);

      await this.auditService.record(manager, {
        targetTable: 'product',
        entityId: id,
        productId: id,
        actorPersonId: user.id,
        actionPerformed: 'UPDATE',
        oldValues,
        newValues: {
          productName: saved.productName,
          description: saved.description,
          isActive: saved.isActive,
        },
        changeReason: dto.changeReason,
        funderOrganizationId: product.funderOrganizationId,
      });
      return saved;
    });
  }

  /**
   * Custom Bespoke Plan Inception (spec core rule 2): a client-restricted
   * product plus its v1 rate card, created and PUBLISHED in one
   * transaction — bespoke pricing applies to exactly one client, so there
   * is no separate draft/publish governance step. Also exercised by the
   * CRA from the Provisional Offer flow (same permission key).
   */
  async createBespoke(
    user: UserContext,
    dto: CreateBespokeProductDto,
  ): Promise<{ product: Product; rateCard: MasterRateCard }> {
    if (user.orgId === 0) {
      throw new BadRequestException(
        'Bespoke products belong to a funder organization',
      );
    }
    validateRateCardRules('CUSTOM', dto);
    return this.dataSource.transaction(async (manager) => {
      let productCode = '';
      for (let attempt = 0; attempt < 5; attempt += 1) {
        productCode = `CST_${String(Math.floor(Math.random() * 1e6)).padStart(6, '0')}`;
        const clash = await manager.findOne(Product, {
          where: { funderOrganizationId: user.orgId, productCode },
        });
        if (!clash) break;
      }
      const product = await manager.save(Product, {
        productCode,
        productName: dto.productName,
        description: dto.description ?? null,
        isCustomBespoke: true,
        clientOwnerOrganizationId: dto.clientOwnerOrganizationId,
        funderOrganizationId: user.orgId,
        isActive: true,
      });
      const rateCard = await manager.save(MasterRateCard, {
        productId: product.id,
        versionNumber: 1,
        status: RateCardStatusEnum.PUBLISHED,
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
        publishedAt: new Date(),
      });
      await this.auditService.record(manager, {
        targetTable: 'product',
        entityId: product.id,
        productId: product.id,
        actorPersonId: user.id,
        actionPerformed: 'CREATE',
        newValues: {
          productCode,
          productName: dto.productName,
          isCustomBespoke: true,
          clientOwnerOrganizationId: dto.clientOwnerOrganizationId,
          rateCardId: rateCard.id,
        },
        changeReason: dto.changeReason,
        funderOrganizationId: user.orgId,
      });
      return { product, rateCard };
    });
  }
}
