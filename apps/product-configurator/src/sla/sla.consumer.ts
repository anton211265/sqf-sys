import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { Body, Controller, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventPattern } from '@nestjs/microservices';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Kafka } from 'kafkajs';
import { EntityManager } from 'typeorm';
import { ProcessedEventRepository } from '../repositories/processed-event.repository';
import { SlaTimerService } from './sla-timer.service';

interface TimerStartMessage {
  eventId: string;
  funderOrganizationId: number;
  slaCode: string;
  subjectType: string;
  subjectId: string | number;
  region?: string;
  startedAt?: string;
  notifyEmail?: string;
  context?: Record<string, unknown>;
}

interface TimerCancelMessage {
  eventId: string;
  funderOrganizationId: number;
  slaCode: string;
  subjectType: string;
  subjectId: string | number;
  reason?: string;
}

/**
 * Kafka face of the SLA engine — how business flows in OTHER services
 * start/cancel timers (they write SLA_TIMER_START/CANCEL to their own
 * outbox; this consumer is idempotent via processed_event, and timer start
 * is additionally idempotent by subject). Malformed messages are logged
 * and dropped — a poison message must not wedge the consumer group.
 */
@Controller()
export class SlaConsumer {
  private readonly logger = new Logger(SlaConsumer.name);

  constructor(
    private readonly slaTimerService: SlaTimerService,
    private readonly processedEventRepository: ProcessedEventRepository,
    private readonly configService: ConfigService,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  /** Pre-create our topics so a fresh Kafka boot doesn't UNKNOWN_TOPIC. */
  async onModuleInit() {
    try {
      const kafka = new Kafka({
        clientId: 'product-configurator',
        brokers: this.configService.getOrThrow<string>('KAFKA_BROKERS').split(','),
      });
      const admin = kafka.admin();
      const existing = await admin.listTopics();
      const wanted = [
        KafkaTopicEnum.SLA_TIMER_START,
        KafkaTopicEnum.SLA_TIMER_CANCEL,
        KafkaTopicEnum.SLA_BREACHED,
        KafkaTopicEnum.RATE_CARD_PUBLISHED,
        KafkaTopicEnum.PRODUCT_ASSIGNMENT_CREATED,
      ].filter((topic) => !existing.includes(topic));
      if (wanted.length > 0) {
        await admin.createTopics({
          topics: wanted.map((topic) => ({ topic, numPartitions: 2, replicationFactor: 1 })),
        });
      }
      await admin.disconnect();
    } catch (error) {
      this.logger.warn(`Kafka topic pre-creation failed (non-fatal): ${error}`);
    }
  }

  @EventPattern(KafkaTopicEnum.SLA_TIMER_START)
  async onTimerStart(@Body() body: TimerStartMessage) {
    if (!body?.eventId || !body.funderOrganizationId || !body.slaCode || !body.subjectType || body.subjectId === undefined) {
      this.logger.warn(`Dropping malformed SLA_TIMER_START: ${JSON.stringify(body)}`);
      return;
    }
    if (await this.processedEventRepository.exists(body.eventId)) {
      this.logger.warn(`Skipping already-processed SLA_TIMER_START: ${body.eventId}`);
      return;
    }
    try {
      await this.slaTimerService.start({
        funderOrganizationId: body.funderOrganizationId,
        slaCode: body.slaCode,
        subjectType: body.subjectType,
        subjectId: String(body.subjectId),
        region: body.region,
        startedAt: body.startedAt,
        notifyEmail: body.notifyEmail,
        context: body.context,
      });
    } catch (error) {
      // Unknown/inactive template is a producer bug, not a retryable fault
      this.logger.error(`SLA_TIMER_START rejected: ${error}`);
    }
    await this.entityManager.transaction(async (manager) => {
      await this.processedEventRepository.record(manager, {
        id: body.eventId,
        topic: KafkaTopicEnum.SLA_TIMER_START,
      });
    });
  }

  @EventPattern(KafkaTopicEnum.SLA_TIMER_CANCEL)
  async onTimerCancel(@Body() body: TimerCancelMessage) {
    if (!body?.eventId || !body.funderOrganizationId || !body.slaCode || !body.subjectType || body.subjectId === undefined) {
      this.logger.warn(`Dropping malformed SLA_TIMER_CANCEL: ${JSON.stringify(body)}`);
      return;
    }
    if (await this.processedEventRepository.exists(body.eventId)) {
      this.logger.warn(`Skipping already-processed SLA_TIMER_CANCEL: ${body.eventId}`);
      return;
    }
    await this.slaTimerService.resolveBySubject(
      body.funderOrganizationId,
      body.slaCode,
      body.subjectType,
      String(body.subjectId),
      body.reason,
    );
    await this.entityManager.transaction(async (manager) => {
      await this.processedEventRepository.record(manager, {
        id: body.eventId,
        topic: KafkaTopicEnum.SLA_TIMER_CANCEL,
      });
    });
  }
}
