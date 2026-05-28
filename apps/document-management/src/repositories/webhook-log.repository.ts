import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { WebhookLog } from '../models/webhook-log.entity';

@Injectable()
export class WebhookLogRepository extends AbstractRepository<WebhookLog> {
  protected readonly logger = new Logger(WebhookLogRepository.name);

  constructor(
    @InjectRepository(WebhookLog)
    webhookLogRepository: Repository<WebhookLog>,
    entityManager: EntityManager,
  ) {
    super(webhookLogRepository, entityManager);
  }
}
