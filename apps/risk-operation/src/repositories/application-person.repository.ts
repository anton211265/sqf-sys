import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ApplicationPerson } from '../models';

export class ApplicationPersonRepository extends AbstractRepository<ApplicationPerson> {
  protected readonly logger = new Logger(ApplicationPerson.name);

  constructor(
    @InjectRepository(ApplicationPerson)
    repository: Repository<ApplicationPerson>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
