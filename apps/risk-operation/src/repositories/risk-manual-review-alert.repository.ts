import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { RiskModel } from '../models/risk-model.entity';
import { RiskManualReviewAlert } from '../models/risk-manual-review-alert.entity';

@Injectable()
export class RiskManualReviewAlertRepository extends AbstractRepository<RiskManualReviewAlert> {
  protected readonly logger = new Logger(RiskManualReviewAlert.name);

  constructor(
    @InjectRepository(RiskManualReviewAlert)
    repository: Repository<RiskManualReviewAlert>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
