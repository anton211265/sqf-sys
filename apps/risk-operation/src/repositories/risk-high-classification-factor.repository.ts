import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { RiskModel } from '../models/risk-model.entity';
import { RiskEvaluationParameter } from '../models/risk-evaluation-parameter.entity';
import { RiskHighClassificationFactor } from '../models/risk-high-classification-factor.entity';

@Injectable()
export class RiskHighClassificationFactorRepository extends AbstractRepository<RiskHighClassificationFactor> {
  protected readonly logger = new Logger(RiskHighClassificationFactor.name);

  constructor(
    @InjectRepository(RiskHighClassificationFactor)
    repository: Repository<RiskHighClassificationFactor>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
