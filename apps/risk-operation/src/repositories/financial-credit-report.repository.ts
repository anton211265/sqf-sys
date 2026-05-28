import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { FinancialCreditReport } from '../models/financial-credit-report.entity';

export class FinancialCreditReportRepository extends AbstractRepository<FinancialCreditReport> {
  protected readonly logger = new Logger(FinancialCreditReport.name);

  constructor(
    @InjectRepository(FinancialCreditReport)
    repository: Repository<FinancialCreditReport>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
