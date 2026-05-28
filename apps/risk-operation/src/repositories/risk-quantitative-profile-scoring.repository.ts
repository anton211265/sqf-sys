import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { FinancialCreditReport } from '../models/financial-credit-report.entity';
import { RiskProfile } from '../models/risk-profile.entity';
import { RiskQuantitativeProfileScoring } from '../models/risk-quantitative-profile-scoring.entity';

export class RiskQuantitativeProfileScoringRepository extends AbstractRepository<RiskQuantitativeProfileScoring> {
  protected readonly logger = new Logger(RiskProfile.name);

  constructor(
    @InjectRepository(RiskQuantitativeProfileScoring)
    repository: Repository<RiskQuantitativeProfileScoring>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
