import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { RiskApplicationScoring } from '../models/risk-application-scoring.entity';

@Injectable()
export class RiskApplicationScoringRepository extends AbstractRepository<RiskApplicationScoring> {
  protected readonly logger = new Logger(RiskApplicationScoring.name);

  constructor(
    @InjectRepository(RiskApplicationScoring)
    repository: Repository<RiskApplicationScoring>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
