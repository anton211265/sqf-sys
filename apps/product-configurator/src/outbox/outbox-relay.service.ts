import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxEventRepository } from '../repositories/outbox-event.repository';

@Injectable()
export class OutboxRelayService {
  private readonly logger = new Logger(OutboxRelayService.name);

  constructor(
    private readonly outboxEventRepository: OutboxEventRepository,
    @Inject(DependencyInjectionTokenEnum.KAFKA_PRODUCER)
    private readonly kafkaProducer: ClientKafka,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async relayPendingEvents() {
    const pendingEvents = await this.outboxEventRepository.findPending(50);

    for (const event of pendingEvents) {
      try {
        this.kafkaProducer.emit(event.topic, event.payload);
        await this.outboxEventRepository.markSent(event.id);
      } catch (error) {
        this.logger.error(
          `Failed to relay outbox event ${event.id} for topic ${event.topic}`,
          error,
        );
        await this.outboxEventRepository.markFailed(event.id);
      }
    }
  }
}
