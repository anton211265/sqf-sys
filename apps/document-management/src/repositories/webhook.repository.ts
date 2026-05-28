import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Webhook } from '../models/webhook.entity';

@Injectable()
export class WebhookRepository extends AbstractRepository<Webhook> {
  protected readonly logger = new Logger(WebhookRepository.name);

  constructor(
    @InjectRepository(Webhook)
    webhookRepository: Repository<Webhook>,
    entityManager: EntityManager,
  ) {
    super(webhookRepository, entityManager);
  }
}
