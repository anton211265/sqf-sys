import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { RiskQuantitativeThresholdRule } from '../models/risk-quantitative-threshold-rule.entity';

export class RiskQuantitativeThresholdRuleRepository extends AbstractRepository<RiskQuantitativeThresholdRule> {
  protected readonly logger = new Logger(RiskQuantitativeThresholdRule.name);

  constructor(
    @InjectRepository(RiskQuantitativeThresholdRule)
    repository: Repository<RiskQuantitativeThresholdRule>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
