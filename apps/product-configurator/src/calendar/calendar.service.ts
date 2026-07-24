import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigAuditService } from '../audit/config-audit.service';
import { CalendarSettingsDto, UpsertCalendarDayDto } from '../dtos';
import { CalendarDay } from '../models/calendar.entities';
import { funderScope, UserContext } from '../products/products.service';
import { ConfigSettingsService } from '../settings/config-settings.service';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(CalendarDay)
    private readonly dayRepository: Repository<CalendarDay>,
    private readonly settingsService: ConfigSettingsService,
    private readonly auditService: ConfigAuditService,
    private readonly dataSource: DataSource,
  ) {}

  async overview(user: UserContext) {
    const [days, settings] = await Promise.all([
      this.dayRepository.find({
        where: funderScope(user.orgId),
        order: { region: 'ASC', dayDate: 'ASC' },
      }),
      user.orgId === 0 ? Promise.resolve(null) : this.settingsService.getOrCreate(user),
    ]);
    return {
      days,
      settings: settings && { rolloverRule: settings.rolloverRule },
    };
  }

  async upsertDay(user: UserContext, dto: UpsertCalendarDayDto) {
    if (user.orgId === 0) {
      throw new BadRequestException(
        'Clearing calendars belong to a funder organization',
      );
    }
    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(CalendarDay, {
        where: {
          funderOrganizationId: user.orgId,
          region: dto.region,
          dayDate: dto.dayDate,
        },
      });
      const saved = await manager.save(CalendarDay, {
        ...(existing ?? {
          funderOrganizationId: user.orgId,
          region: dto.region,
          dayDate: dto.dayDate,
        }),
        dayType: dto.dayType ?? existing?.dayType ?? undefined,
        description: dto.description ?? existing?.description ?? null,
        cutoffTime: dto.cutoffTime ?? existing?.cutoffTime ?? null,
      });
      await this.auditService.record(manager, {
        targetTable: 'calendar_day',
        entityId: saved.id,
        actorPersonId: user.id,
        actionPerformed: existing ? 'UPDATE' : 'CREATE',
        oldValues: existing
          ? { dayType: existing.dayType, description: existing.description, cutoffTime: existing.cutoffTime }
          : null,
        newValues: { ...dto },
        funderOrganizationId: user.orgId,
      });
      return saved;
    });
  }

  async deleteDay(user: UserContext, id: number) {
    const row = await this.dayRepository.findOne({
      where: { id, ...funderScope(user.orgId) },
    });
    if (!row) throw new NotFoundException('Calendar day not found');
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(CalendarDay, { id });
      await this.auditService.record(manager, {
        targetTable: 'calendar_day',
        entityId: id,
        actorPersonId: user.id,
        actionPerformed: 'DELETE',
        oldValues: { region: row.region, dayDate: row.dayDate, dayType: row.dayType },
        newValues: { deleted: true },
        funderOrganizationId: row.funderOrganizationId,
      });
    });
    return { success: true };
  }

  async patchSettings(user: UserContext, dto: CalendarSettingsDto) {
    if (user.orgId === 0) {
      throw new BadRequestException(
        'Clearing calendars belong to a funder organization',
      );
    }
    return this.dataSource.transaction(async (manager) =>
      this.settingsService.patch(manager, user, { rolloverRule: dto.rolloverRule }),
    );
  }
}
