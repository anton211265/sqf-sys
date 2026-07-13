import { ProcessedEvent } from '@app/common/database/processed-event.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class ProcessedEventRepository {
  constructor(
    @InjectRepository(ProcessedEvent)
    private readonly repository: Repository<ProcessedEvent>,
  ) {}

  async exists(id: string): Promise<boolean> {
    const found = await this.repository.findOne({ where: { id } });
    return !!found;
  }

  async record(
    manager: EntityManager,
    event: { id: string; topic: string },
  ): Promise<void> {
    await manager.insert(ProcessedEvent, new ProcessedEvent(event));
  }
}
