import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { KycAgencyReport } from '../models/kyc-agency-report.entity';

export class KycAgencyReportRepository extends AbstractRepository<KycAgencyReport> {
  protected readonly logger = new Logger(KycAgencyReport.name);

  constructor(
    @InjectRepository(KycAgencyReport)
    repository: Repository<KycAgencyReport>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
