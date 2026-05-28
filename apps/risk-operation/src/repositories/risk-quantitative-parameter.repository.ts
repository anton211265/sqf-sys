import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { RiskQuantitativeParameter } from '../models/risk-quantitative-parameter.entity';

export class RiskQuantitativeParameterRepository extends AbstractRepository<RiskQuantitativeParameter> {
  protected readonly logger = new Logger(RiskQuantitativeParameter.name);

  constructor(
    @InjectRepository(RiskQuantitativeParameter)
    repository: Repository<RiskQuantitativeParameter>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
