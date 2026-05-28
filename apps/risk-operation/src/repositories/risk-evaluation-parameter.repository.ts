import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { RiskModel } from '../models/risk-model.entity';
import { RiskEvaluationParameter } from '../models/risk-evaluation-parameter.entity';

@Injectable()
export class RiskEvaluationParameterRepository extends AbstractRepository<RiskEvaluationParameter> {
  protected readonly logger = new Logger(RiskEvaluationParameter.name);

  constructor(
    @InjectRepository(RiskEvaluationParameter)
    repository: Repository<RiskEvaluationParameter>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
