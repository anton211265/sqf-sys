import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigAuditService } from '../audit/config-audit.service';
import { BillingSettingsDto, UpsertFeeDto, UpsertRateIndexDto } from '../dtos';
import { BaseRateIndex, FeeSchedule } from '../models/billing-config.entity';
import { funderScope, UserContext } from '../products/products.service';
import { ConfigSettingsService } from '../settings/config-settings.service';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(BaseRateIndex)
    private readonly indexRepository: Repository<BaseRateIndex>,
    @InjectRepository(FeeSchedule)
    private readonly feeRepository: Repository<FeeSchedule>,
    private readonly settingsService: ConfigSettingsService,
    private readonly auditService: ConfigAuditService,
    private readonly dataSource: DataSource,
  ) {}

  async overview(user: UserContext) {
    const [indices, fees, settings] = await Promise.all([
      this.indexRepository.find({
        where: funderScope(user.orgId),
        order: { indexCode: 'ASC' },
      }),
      this.feeRepository.find({
        where: funderScope(user.orgId),
        order: { feeCode: 'ASC' },
      }),
      user.orgId === 0 ? Promise.resolve(null) : this.settingsService.getOrCreate(user),
    ]);
    return {
      indices,
      fees,
      settings: settings && {
        dayCountConvention: settings.dayCountConvention,
        penaltyMarginPct: settings.penaltyMarginPct,
      },
    };
  }

  async upsertIndex(user: UserContext, dto: UpsertRateIndexDto) {
    this.assertFunder(user);
    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(BaseRateIndex, {
        where: { funderOrganizationId: user.orgId, indexCode: dto.indexCode },
      });
      const saved = await manager.save(BaseRateIndex, {
        ...(existing ?? { funderOrganizationId: user.orgId, indexCode: dto.indexCode }),
        ratePct: String(dto.ratePct),
        updateMode: dto.updateMode ?? existing?.updateMode ?? undefined,
      });
      await this.auditService.record(manager, {
        targetTable: 'base_rate_index',
        entityId: saved.id,
        actorPersonId: user.id,
        actionPerformed: existing ? 'UPDATE' : 'CREATE',
        oldValues: existing
          ? { ratePct: existing.ratePct, updateMode: existing.updateMode }
          : null,
        newValues: { indexCode: dto.indexCode, ratePct: dto.ratePct, updateMode: dto.updateMode },
        funderOrganizationId: user.orgId,
      });
      return saved;
    });
  }

  async deleteIndex(user: UserContext, id: number) {
    return this.deleteOwn(user, this.indexRepository, BaseRateIndex, 'base_rate_index', id);
  }

  async upsertFee(user: UserContext, dto: UpsertFeeDto) {
    this.assertFunder(user);
    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(FeeSchedule, {
        where: { funderOrganizationId: user.orgId, feeCode: dto.feeCode },
      });
      const saved = await manager.save(FeeSchedule, {
        ...(existing ?? { funderOrganizationId: user.orgId, feeCode: dto.feeCode }),
        feeName: dto.feeName,
        amount: String(dto.amount),
        chargeBasis: dto.chargeBasis ?? existing?.chargeBasis ?? undefined,
        deductionRule: dto.deductionRule ?? existing?.deductionRule ?? undefined,
        isActive: dto.isActive ?? existing?.isActive ?? true,
      });
      await this.auditService.record(manager, {
        targetTable: 'fee_schedule',
        entityId: saved.id,
        actorPersonId: user.id,
        actionPerformed: existing ? 'UPDATE' : 'CREATE',
        oldValues: existing
          ? { feeName: existing.feeName, amount: existing.amount, isActive: existing.isActive }
          : null,
        newValues: { ...dto },
        funderOrganizationId: user.orgId,
      });
      return saved;
    });
  }

  async deleteFee(user: UserContext, id: number) {
    return this.deleteOwn(user, this.feeRepository, FeeSchedule, 'fee_schedule', id);
  }

  async patchSettings(user: UserContext, dto: BillingSettingsDto) {
    this.assertFunder(user);
    return this.dataSource.transaction(async (manager) =>
      this.settingsService.patch(manager, user, {
        ...(dto.dayCountConvention !== undefined && {
          dayCountConvention: dto.dayCountConvention,
        }),
        ...(dto.penaltyMarginPct !== undefined && {
          penaltyMarginPct: String(dto.penaltyMarginPct),
        }),
      }),
    );
  }

  private assertFunder(user: UserContext) {
    if (user.orgId === 0) {
      throw new BadRequestException(
        'Billing configuration belongs to a funder organization',
      );
    }
  }

  /** Shared org-scoped delete + audit for the simple config collections. */
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
        oldValues: row as unknown as Record<string, unknown>,
        newValues: { deleted: true },
        funderOrganizationId: row.funderOrganizationId,
      });
    });
    return { success: true };
  }
}
