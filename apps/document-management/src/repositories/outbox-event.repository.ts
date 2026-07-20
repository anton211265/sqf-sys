import {
  OutboxEvent,
  OutboxEventStatusEnum,
} from '@app/common/database/outbox-event.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

// Same shape as trade-directory's OutboxEventRepository — the transactional
// outbox write happens inside the caller's business transaction.
@Injectable()
export class OutboxEventRepository {
  constructor(
    @InjectRepository(OutboxEvent)
    private readonly repository: Repository<OutboxEvent>,
  ) {}

  async record(
    manager: EntityManager,
    event: { id: string; topic: string; payload: Record<string, unknown> },
  ): Promise<void> {
    await manager.insert(OutboxEvent, new OutboxEvent(event));
  }

  async findPending(limit: number): Promise<OutboxEvent[]> {
    return this.repository.find({
      where: { status: OutboxEventStatusEnum.PENDING },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  async markSent(id: string): Promise<void> {
    await this.repository.update(id, {
      status: OutboxEventStatusEnum.SENT,
      sentAt: new Date(),
    });
  }

  async markFailed(id: string): Promise<void> {
    await this.repository.update(id, { status: OutboxEventStatusEnum.FAILED });
  }
}
