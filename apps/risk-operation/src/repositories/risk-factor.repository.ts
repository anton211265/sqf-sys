import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { RiskFactor } from '../models/risk-factor.entity';

@Injectable()
export class RiskFactorRepository extends AbstractRepository<RiskFactor> {
  protected readonly logger = new Logger(RiskFactor.name);

  constructor(
    @InjectRepository(RiskFactor)
    repository: Repository<RiskFactor>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
