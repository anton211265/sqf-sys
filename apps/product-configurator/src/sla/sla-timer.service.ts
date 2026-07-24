import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { StartTimerDto } from '../dtos';
import {
  CalendarDay,
  CalendarDayTypeEnum,
} from '../models/calendar-day.entity';
import { SlaTemplate, SlaWindowUnitEnum } from '../models/governance-config.entity';
import { SlaTimer, SlaTimerStatusEnum } from '../models/sla-timer.entity';
import { funderScope, UserContext } from '../products/products.service';

export interface StartTimerInput extends StartTimerDto {
  funderOrganizationId: number;
}

@Injectable()
export class SlaTimerService {
  private readonly logger = new Logger(SlaTimerService.name);

  constructor(
    @InjectRepository(SlaTimer)
    private readonly timerRepository: Repository<SlaTimer>,
    @InjectRepository(SlaTemplate)
    private readonly templateRepository: Repository<SlaTemplate>,
    @InjectRepository(CalendarDay)
    private readonly calendarRepository: Repository<CalendarDay>,
    private readonly dataSource: DataSource,
  ) {}

  async list(user: UserContext, status?: string): Promise<SlaTimer[]> {
    return this.timerRepository.find({
      where: {
        ...funderScope(user.orgId),
        ...(status ? { status: status as SlaTimerStatusEnum } : {}),
      },
      order: { deadlineAt: 'ASC' },
      take: 500,
    });
  }

  /**
   * Idempotent start: an existing RUNNING timer for the same
   * (funder, slaCode, subject) is returned unchanged — safe under
   * at-least-once Kafka delivery and double-clicking humans alike.
   */
  async start(input: StartTimerInput): Promise<SlaTimer> {
    const template = await this.templateRepository.findOne({
      where: {
        funderOrganizationId: input.funderOrganizationId,
        slaCode: input.slaCode,
      },
    });
    if (!template) {
      throw new NotFoundException(`No SLA template ${input.slaCode} for this funder`);
    }
    if (!template.isActive) {
      throw new BadRequestException(`SLA template ${input.slaCode} is inactive`);
    }

    const existing = await this.timerRepository.findOne({
      where: {
        funderOrganizationId: input.funderOrganizationId,
        slaCode: input.slaCode,
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        status: SlaTimerStatusEnum.RUNNING,
      },
    });
    if (existing) return existing;

    const startedAt = input.startedAt ? new Date(input.startedAt) : new Date();
    if (Number.isNaN(startedAt.getTime())) {
      throw new BadRequestException('Invalid startedAt');
    }
    const deadlineAt = await this.computeDeadline(
      template,
      startedAt,
      input.funderOrganizationId,
      input.region ?? null,
    );

    return this.timerRepository.save({
      funderOrganizationId: input.funderOrganizationId,
      slaTemplateId: template.id,
      slaCode: template.slaCode,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      region: input.region ?? null,
      startedAt,
      deadlineAt,
      status: SlaTimerStatusEnum.RUNNING,
      notifyEmail: input.notifyEmail ?? null,
      context: input.context ?? null,
    });
  }

  async resolveById(user: UserContext, id: number, reason?: string): Promise<SlaTimer> {
    const timer = await this.timerRepository.findOne({
      where: { id, ...funderScope(user.orgId) },
    });
    if (!timer) throw new NotFoundException('Timer not found');
    if (timer.status !== SlaTimerStatusEnum.RUNNING) {
      throw new BadRequestException(`Timer is ${timer.status}, not RUNNING`);
    }
    timer.status = SlaTimerStatusEnum.RESOLVED;
    timer.resolvedAt = new Date();
    timer.resolveReason = reason ?? null;
    return this.timerRepository.save(timer);
  }

  /** Kafka-side resolve: addressed by subject, silently no-ops if absent. */
  async resolveBySubject(
    funderOrganizationId: number,
    slaCode: string,
    subjectType: string,
    subjectId: string,
    reason?: string,
  ): Promise<void> {
    const timer = await this.timerRepository.findOne({
      where: {
        funderOrganizationId,
        slaCode,
        subjectType,
        subjectId,
        status: SlaTimerStatusEnum.RUNNING,
      },
    });
    if (!timer) {
      this.logger.warn(
        `SLA_TIMER_CANCEL for absent timer ${slaCode}/${subjectType}/${subjectId} (funder ${funderOrganizationId})`,
      );
      return;
    }
    timer.status = SlaTimerStatusEnum.RESOLVED;
    timer.resolvedAt = new Date();
    timer.resolveReason = reason ?? 'cancelled by originating flow';
    await this.timerRepository.save(timer);
  }

  /**
   * HOURS/DAYS are absolute clock arithmetic. WORKING_DAYS counts forward
   * skipping weekends plus the funder's clearing-calendar HOLIDAY/SHUTDOWN
   * days (HALF_DAY still counts as a working day); region-specific days
   * apply only when the timer carries that region. Deadline keeps the
   * start's time-of-day.
   */
  private async computeDeadline(
    template: SlaTemplate,
    startedAt: Date,
    funderOrganizationId: number,
    region: string | null,
  ): Promise<Date> {
    if (template.windowUnit === SlaWindowUnitEnum.HOURS) {
      return new Date(startedAt.getTime() + template.windowValue * 3600_000);
    }
    if (template.windowUnit === SlaWindowUnitEnum.DAYS) {
      return new Date(startedAt.getTime() + template.windowValue * 86_400_000);
    }

    const exclusions = new Set(
      (
        await this.calendarRepository.find({
          where: {
            funderOrganizationId,
            ...(region ? { region } : {}),
            dayType: In([CalendarDayTypeEnum.HOLIDAY, CalendarDayTypeEnum.SHUTDOWN]),
          },
        })
      ).map((d) => String(d.dayDate)),
    );
    const isWorkingDay = (d: Date): boolean => {
      const dow = d.getUTCDay();
      if (dow === 0 || dow === 6) return false;
      return !exclusions.has(d.toISOString().slice(0, 10));
    };

    const deadline = new Date(startedAt.getTime());
    let counted = 0;
    // Guard rail: windowValue <= a year of iterations even with exclusions
    for (let i = 0; counted < template.windowValue && i < 2000; i += 1) {
      deadline.setUTCDate(deadline.getUTCDate() + 1);
      if (isWorkingDay(deadline)) counted += 1;
    }
    return deadline;
  }
}
