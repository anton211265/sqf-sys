import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { DataSource, LessThan, Repository } from 'typeorm';
import { SlaTemplate } from '../models/governance-config.entity';
import { SlaTimer, SlaTimerStatusEnum } from '../models/sla-timer.entity';
import { OutboxEventRepository } from '../repositories/outbox-event.repository';

/**
 * The firing half of the SLA engine: every 30s, overdue RUNNING timers are
 * marked BREACHED and an SLA_BREACHED event is written to the outbox in the
 * same transaction (dashboards / future flow consumers). When the start
 * payload carried notifyEmail, a SEND_EMAIL event rides in the same
 * transaction too — the notification service takes it from there. The
 * symbolic breachAction → role-holder resolution stays with the business
 * flows that will start these timers; notifyEmail is the wiring that works
 * before those flows exist.
 */
@Injectable()
export class SlaBreachService {
  private readonly logger = new Logger(SlaBreachService.name);

  constructor(
    @InjectRepository(SlaTimer)
    private readonly timerRepository: Repository<SlaTimer>,
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async fireOverdueTimers(): Promise<void> {
    const overdue = await this.timerRepository.find({
      where: {
        status: SlaTimerStatusEnum.RUNNING,
        deadlineAt: LessThan(new Date()),
      },
      order: { deadlineAt: 'ASC' },
      take: 100,
    });

    for (const timer of overdue) {
      try {
        await this.breach(timer);
      } catch (error) {
        this.logger.error(`Failed to breach SLA timer ${timer.id}`, error as Error);
      }
    }
  }

  private async breach(timer: SlaTimer): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // Re-read inside the transaction so a concurrent resolve wins cleanly
      const fresh = await manager.findOne(SlaTimer, { where: { id: timer.id } });
      if (!fresh || fresh.status !== SlaTimerStatusEnum.RUNNING) return;

      const template = await manager.findOne(SlaTemplate, {
        where: { id: fresh.slaTemplateId },
      });

      fresh.status = SlaTimerStatusEnum.BREACHED;
      fresh.breachedAt = new Date();
      await manager.save(SlaTimer, fresh);

      await this.outboxEventRepository.record(manager, {
        id: randomUUID(),
        topic: KafkaTopicEnum.SLA_BREACHED,
        payload: {
          eventId: randomUUID(),
          timerId: fresh.id,
          funderOrganizationId: fresh.funderOrganizationId,
          slaCode: fresh.slaCode,
          slaName: template?.slaName ?? fresh.slaCode,
          breachAction: template?.breachAction ?? null,
          subjectType: fresh.subjectType,
          subjectId: fresh.subjectId,
          startedAt: fresh.startedAt,
          deadlineAt: fresh.deadlineAt,
          context: fresh.context,
        },
      });

      if (fresh.notifyEmail) {
        await this.outboxEventRepository.record(manager, {
          id: randomUUID(),
          topic: KafkaTopicEnum.SEND_EMAIL,
          payload: {
            eventId: randomUUID(),
            emailSender: 'notification@sqf.ai',
            emailReceivers: [fresh.notifyEmail],
            emailCc: [],
            emailBcc: [],
            emailReplyTo: [],
            emailSubject: `SQF.AI - SLA breached: ${template?.slaName ?? fresh.slaCode}`,
            emailBody:
              `<p>The SLA <strong>${template?.slaName ?? fresh.slaCode}</strong> ` +
              `(${fresh.slaCode}) for ${fresh.subjectType} #${fresh.subjectId} ` +
              `breached its deadline of ${fresh.deadlineAt.toISOString()}.</p>` +
              `<p>Configured breach action: ${template?.breachAction ?? 'n/a'}.</p>`,
          },
        });
      }

      this.logger.warn(
        `SLA BREACHED: ${fresh.slaCode} for ${fresh.subjectType} #${fresh.subjectId} (funder ${fresh.funderOrganizationId})`,
      );
    });
  }
}
