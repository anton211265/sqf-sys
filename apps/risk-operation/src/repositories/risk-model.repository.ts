import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { RiskModel } from '../models/risk-model.entity';

@Injectable()
export class RiskModelRepository extends AbstractRepository<RiskModel> {
  protected readonly logger = new Logger(RiskModel.name);

  constructor(
    @InjectRepository(RiskModel)
    repository: Repository<RiskModel>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
