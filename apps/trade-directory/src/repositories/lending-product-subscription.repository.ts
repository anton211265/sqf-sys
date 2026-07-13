import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '@app/common/database/abstract.repository';
import { LendingProductSubscription } from '../models/lending-product-subscription.entity';

@Injectable()
export class LendingProductSubscriptionRepository extends AbstractRepository<LendingProductSubscription> {
  protected readonly logger = new Logger(LendingProductSubscription.name);

  constructor(
    @InjectRepository(LendingProductSubscription)
    repository: Repository<LendingProductSubscription>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
