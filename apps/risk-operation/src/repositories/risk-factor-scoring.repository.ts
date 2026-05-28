import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { RiskFactorScoring } from '../models/risk-factor-scoring.entity';

@Injectable()
export class RiskFactorScoringRepository extends AbstractRepository<RiskFactorScoring> {
  protected readonly logger = new Logger(RiskFactorScoring.name);

  constructor(
    @InjectRepository(RiskFactorScoring)
    repository: Repository<RiskFactorScoring>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
