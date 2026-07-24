import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ConfigAuditService } from '../audit/config-audit.service';
import { FunderConfigSettings } from '../models/funder-config-settings.entity';
import { UserContext } from '../products/products.service';

/**
 * Get-or-create access to the per-funder settings singleton, shared by the
 * billing/calendar/policies services — each PATCHes only the slice its own
 * permission key covers, but they all audit through the same path.
 */
@Injectable()
export class ConfigSettingsService {
  constructor(
    @InjectRepository(FunderConfigSettings)
    private readonly settingsRepository: Repository<FunderConfigSettings>,
    private readonly auditService: ConfigAuditService,
  ) {}

  async getOrCreate(user: UserContext): Promise<FunderConfigSettings> {
    if (user.orgId === 0) {
      throw new BadRequestException(
        'Configuration settings belong to a funder organization',
      );
    }
    const existing = await this.settingsRepository.findOne({
      where: { funderOrganizationId: user.orgId },
    });
    if (existing) return existing;
    return this.settingsRepository.save({ funderOrganizationId: user.orgId });
  }

  /** Apply a partial column update inside the caller's transaction. */
  async patch(
    manager: EntityManager,
    user: UserContext,
    changes: Partial<
      Pick<
        FunderConfigSettings,
        | 'dayCountConvention'
        | 'penaltyMarginPct'
        | 'rolloverRule'
        | 'bankCountryMatchMode'
        | 'corporateEmailMode'
      >
    >,
  ): Promise<FunderConfigSettings> {
    const settings = await this.getOrCreate(user);
    const oldValues: Record<string, unknown> = {};
    for (const key of Object.keys(changes)) {
      oldValues[key] = settings[key as keyof FunderConfigSettings];
    }
    Object.assign(settings, changes);
    const saved = await manager.save(FunderConfigSettings, settings);
    await this.auditService.record(manager, {
      targetTable: 'funder_config_settings',
      entityId: saved.id,
      actorPersonId: user.id,
      actionPerformed: 'UPDATE',
      oldValues,
      newValues: changes as Record<string, unknown>,
      funderOrganizationId: user.orgId,
    });
    return saved;
  }
}
