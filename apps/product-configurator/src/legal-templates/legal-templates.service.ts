import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { ConfigAuditService } from '../audit/config-audit.service';
import { BindTemplatesDto, CreateTemplateDto } from '../dtos';
import { LegalDocumentTemplate } from '../models/legal-document-template.entity';
import { ProductDocumentMapping } from '../models/product-document-mapping.entity';
import {
  funderScope,
  ProductsService,
  UserContext,
} from '../products/products.service';

@Injectable()
export class LegalTemplatesService {
  constructor(
    @InjectRepository(LegalDocumentTemplate)
    private readonly templateRepository: Repository<LegalDocumentTemplate>,
    @InjectRepository(ProductDocumentMapping)
    private readonly mappingRepository: Repository<ProductDocumentMapping>,
    private readonly productsService: ProductsService,
    private readonly auditService: ConfigAuditService,
    private readonly dataSource: DataSource,
  ) {}

  async list(user: UserContext): Promise<LegalDocumentTemplate[]> {
    return this.templateRepository.find({
      where: funderScope(user.orgId),
      order: { id: 'ASC' },
    });
  }

  async create(
    user: UserContext,
    dto: CreateTemplateDto,
  ): Promise<LegalDocumentTemplate> {
    if (user.orgId === 0) {
      throw new BadRequestException(
        'Templates belong to a funder organization',
      );
    }
    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(LegalDocumentTemplate, {
        where: {
          funderOrganizationId: user.orgId,
          documentCode: dto.documentCode,
        },
      });
      if (existing) {
        throw new BadRequestException(
          `Template code ${dto.documentCode} already exists`,
        );
      }
      const template = await manager.save(LegalDocumentTemplate, {
        documentCode: dto.documentCode,
        documentName: dto.documentName,
        templateFileUrl: dto.templateFileUrl ?? null,
        templateBody: dto.templateBody ?? null,
        isRequiredDefault: dto.isRequiredDefault ?? true,
        funderOrganizationId: user.orgId,
      });
      await this.auditService.record(manager, {
        targetTable: 'legal_document_template',
        entityId: template.id,
        actorPersonId: user.id,
        actionPerformed: 'CREATE',
        newValues: {
          documentCode: dto.documentCode,
          documentName: dto.documentName,
        },
        funderOrganizationId: user.orgId,
      });
      return template;
    });
  }

  async listForProduct(
    user: UserContext,
    productId: number,
  ): Promise<LegalDocumentTemplate[]> {
    await this.productsService.getOwn(user, productId);
    const mappings = await this.mappingRepository.find({
      where: { productId },
      relations: ['template'],
    });
    return mappings.map((m) => m.template);
  }

  /** Whole-set replace, mirroring the Role Builder's PUT permissions save. */
  async bindToProduct(
    user: UserContext,
    productId: number,
    dto: BindTemplatesDto,
  ): Promise<LegalDocumentTemplate[]> {
    const product = await this.productsService.getOwn(user, productId);
    const templates = await this.templateRepository.find({
      where: { id: In(dto.templateIds), ...funderScope(user.orgId) },
    });
    if (templates.length !== dto.templateIds.length) {
      throw new NotFoundException(
        'One or more templates not found in your organization',
      );
    }
    await this.dataSource.transaction(async (manager) => {
      const old = await manager.find(ProductDocumentMapping, {
        where: { productId },
      });
      await manager.delete(ProductDocumentMapping, { productId });
      await manager.insert(
        ProductDocumentMapping,
        dto.templateIds.map((templateId) => ({ productId, templateId })),
      );
      await this.auditService.record(manager, {
        targetTable: 'product_document_mapping',
        entityId: productId,
        productId,
        actorPersonId: user.id,
        actionPerformed: 'BIND',
        oldValues: { templateIds: old.map((m) => m.templateId) },
        newValues: { templateIds: dto.templateIds },
        funderOrganizationId: product.funderOrganizationId,
      });
    });
    return templates;
  }
}
