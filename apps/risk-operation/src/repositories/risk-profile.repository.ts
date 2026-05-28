import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { FinancialCreditReport } from '../models/financial-credit-report.entity';
import { RiskProfile } from '../models/risk-profile.entity';

export class RiskProfileRepository extends AbstractRepository<RiskProfile> {
  protected readonly logger = new Logger(RiskProfile.name);

  constructor(
    @InjectRepository(RiskProfile)
    repository: Repository<RiskProfile>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
