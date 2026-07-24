import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigAuditService } from '../audit/config-audit.service';
import {
  PolicySettingsDto,
  UpsertApprovalRuleDto,
  UpsertCreditRangeDto,
  UpsertSlaDto,
} from '../dtos';
import {
  ApprovalMatrixRule,
  CreditLimitRange,
  SlaTemplate,
} from '../models/governance.entities';
import { funderScope, UserContext } from '../products/products.service';
import { ConfigSettingsService } from '../settings/config-settings.service';

@Injectable()
export class PoliciesService {
  constructor(
    @InjectRepository(SlaTemplate)
    private readonly slaRepository: Repository<SlaTemplate>,
    @InjectRepository(ApprovalMatrixRule)
    private readonly approvalRepository: Repository<ApprovalMatrixRule>,
    @InjectRepository(CreditLimitRange)
    private readonly rangeRepository: Repository<CreditLimitRange>,
    private readonly settingsService: ConfigSettingsService,
    private readonly auditService: ConfigAuditService,
    private readonly dataSource: DataSource,
  ) {}

  async overview(user: UserContext) {
    const [slas, approvalRules, creditRanges, settings] = await Promise.all([
      this.slaRepository.find({
        where: funderScope(user.orgId),
        order: { slaCode: 'ASC' },
      }),
      this.approvalRepository.find({
        where: funderScope(user.orgId),
        order: { scope: 'ASC', thresholdAmount: 'ASC' },
      }),
      this.rangeRepository.find({
        where: funderScope(user.orgId),
        order: { productCode: 'ASC', riskBand: 'ASC' },
      }),
      user.orgId === 0 ? Promise.resolve(null) : this.settingsService.getOrCreate(user),
    ]);
    return {
      slas,
      approvalRules,
      creditRanges,
      settings: settings && {
        bankCountryMatchMode: settings.bankCountryMatchMode,
        corporateEmailMode: settings.corporateEmailMode,
      },
    };
  }

  // ---- SLA templates (config_sla_manage) ----

  async upsertSla(user: UserContext, dto: UpsertSlaDto) {
    this.assertFunder(user);
    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(SlaTemplate, {
        where: { funderOrganizationId: user.orgId, slaCode: dto.slaCode },
      });
      const saved = await manager.save(SlaTemplate, {
        ...(existing ?? { funderOrganizationId: user.orgId, slaCode: dto.slaCode }),
        slaName: dto.slaName,
        windowValue: dto.windowValue,
        windowUnit: dto.windowUnit ?? existing?.windowUnit ?? undefined,
        breachAction: dto.breachAction,
        isActive: dto.isActive ?? existing?.isActive ?? true,
      });
      await this.auditService.record(manager, {
        targetTable: 'sla_template',
        entityId: saved.id,
        actorPersonId: user.id,
        actionPerformed: existing ? 'UPDATE' : 'CREATE',
        oldValues: existing
          ? {
              slaName: existing.slaName,
              windowValue: existing.windowValue,
              windowUnit: existing.windowUnit,
              breachAction: existing.breachAction,
              isActive: existing.isActive,
            }
          : null,
        newValues: { ...dto },
        funderOrganizationId: user.orgId,
      });
      return saved;
    });
  }

  async deleteSla(user: UserContext, id: number) {
    return this.deleteOwn(user, this.slaRepository, SlaTemplate, 'sla_template', id);
  }

  // ---- Approval matrix (config_approval_matrix_manage) ----

  async upsertApprovalRule(user: UserContext, dto: UpsertApprovalRuleDto) {
    this.assertFunder(user);
    return this.dataSource.transaction(async (manager) => {
      const existing = dto.id
        ? await manager.findOne(ApprovalMatrixRule, {
            where: { id: dto.id, funderOrganizationId: user.orgId },
          })
        : null;
      if (dto.id && !existing) {
        throw new NotFoundException('Approval rule not found');
      }
      const saved = await manager.save(ApprovalMatrixRule, {
        ...(existing ?? { funderOrganizationId: user.orgId }),
        scope: dto.scope,
        thresholdAmount:
          dto.thresholdAmount !== undefined ? String(dto.thresholdAmount) : null,
        requiredApprovals: dto.requiredApprovals,
        mode: dto.mode ?? existing?.mode ?? undefined,
        description: dto.description ?? existing?.description ?? null,
      });
      await this.auditService.record(manager, {
        targetTable: 'approval_matrix_rule',
        entityId: saved.id,
        actorPersonId: user.id,
        actionPerformed: existing ? 'UPDATE' : 'CREATE',
        oldValues: existing
          ? {
              scope: existing.scope,
              thresholdAmount: existing.thresholdAmount,
              requiredApprovals: existing.requiredApprovals,
              mode: existing.mode,
            }
          : null,
        newValues: { ...dto },
        funderOrganizationId: user.orgId,
      });
      return saved;
    });
  }

  async deleteApprovalRule(user: UserContext, id: number) {
    return this.deleteOwn(
      user,
      this.approvalRepository,
      ApprovalMatrixRule,
      'approval_matrix_rule',
      id,
    );
  }

  // ---- Credit-limit ranges (config_credit_ranges_manage) ----

  async upsertCreditRange(user: UserContext, dto: UpsertCreditRangeDto) {
    this.assertFunder(user);
    if (dto.minLimit > dto.maxLimit) {
      throw new BadRequestException('minLimit cannot exceed maxLimit');
    }
    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(CreditLimitRange, {
        where: {
          funderOrganizationId: user.orgId,
          productCode: dto.productCode,
          riskBand: dto.riskBand,
        },
      });
      const saved = await manager.save(CreditLimitRange, {
        ...(existing ?? {
          funderOrganizationId: user.orgId,
          productCode: dto.productCode,
          riskBand: dto.riskBand,
        }),
        minLimit: String(dto.minLimit),
        maxLimit: String(dto.maxLimit),
      });
      await this.auditService.record(manager, {
        targetTable: 'credit_limit_range',
        entityId: saved.id,
        actorPersonId: user.id,
        actionPerformed: existing ? 'UPDATE' : 'CREATE',
        oldValues: existing
          ? { minLimit: existing.minLimit, maxLimit: existing.maxLimit }
          : null,
        newValues: { ...dto },
        funderOrganizationId: user.orgId,
      });
      return saved;
    });
  }

  async deleteCreditRange(user: UserContext, id: number) {
    return this.deleteOwn(
      user,
      this.rangeRepository,
      CreditLimitRange,
      'credit_limit_range',
      id,
    );
  }

  // ---- Operational policies (config_policies_manage) ----

  async patchSettings(user: UserContext, dto: PolicySettingsDto) {
    this.assertFunder(user);
    return this.dataSource.transaction(async (manager) =>
      this.settingsService.patch(manager, user, {
        ...(dto.bankCountryMatchMode !== undefined && {
          bankCountryMatchMode: dto.bankCountryMatchMode,
        }),
        ...(dto.corporateEmailMode !== undefined && {
          corporateEmailMode: dto.corporateEmailMode,
        }),
      }),
    );
  }

  private assertFunder(user: UserContext) {
    if (user.orgId === 0) {
      throw new BadRequestException(
        'Governance policies belong to a funder organization',
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async deleteOwn(
    user: UserContext,
    repository: Repository<any>,
    entityClass: new () => unknown,
    targetTable: string,
    id: number,
  ) {
    const row = await repository.findOne({
      where: { id, ...funderScope(user.orgId) },
    });
    if (!row) throw new NotFoundException('Not found');
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(entityClass, { id });
      await this.auditService.record(manager, {
        targetTable,
        entityId: id,
        actorPersonId: user.id,
        actionPerformed: 'DELETE',
        oldValues: row as Record<string, unknown>,
        newValues: { deleted: true },
        funderOrganizationId: row.funderOrganizationId,
      });
    });
    return { success: true };
  }
}
