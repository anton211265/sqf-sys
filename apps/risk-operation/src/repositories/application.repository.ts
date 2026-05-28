import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Application } from '../models';

export class ApplicationRepository extends AbstractRepository<Application> {
  protected readonly logger = new Logger(Application.name);

  constructor(
    @InjectRepository(Application)
    repository: Repository<Application>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
