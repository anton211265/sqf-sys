import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { RiskHighClassificationScoring } from '../models/risk-high-classification-scoring.entity';

@Injectable()
export class RiskHighClassificationScoringRepository extends AbstractRepository<RiskHighClassificationScoring> {
  protected readonly logger = new Logger(RiskHighClassificationScoring.name);

  constructor(
    @InjectRepository(RiskHighClassificationScoring)
    repository: Repository<RiskHighClassificationScoring>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
