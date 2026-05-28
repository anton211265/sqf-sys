import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Experian } from '../models/experian.entity';

export class ExperianRepository extends AbstractRepository<Experian> {
  protected readonly logger = new Logger(Experian.name);

  constructor(
    @InjectRepository(Experian)
    repository: Repository<Experian>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
