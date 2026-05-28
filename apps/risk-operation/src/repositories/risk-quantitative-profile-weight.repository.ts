import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { RiskQuantitativeProfileWeight } from '../models/risk-quantitative-profile-weight.entity';

export class RiskQuantitativeProfileWeightRepository extends AbstractRepository<RiskQuantitativeProfileWeight> {
  protected readonly logger = new Logger(RiskQuantitativeProfileWeight.name);

  constructor(
    @InjectRepository(RiskQuantitativeProfileWeight)
    repository: Repository<RiskQuantitativeProfileWeight>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
