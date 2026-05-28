import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { OrganizationPerson } from '../models';

export class OrganizationPersonRepository extends AbstractRepository<OrganizationPerson> {
  protected readonly logger = new Logger(OrganizationPerson.name);

  constructor(
    @InjectRepository(OrganizationPerson)
    repository: Repository<OrganizationPerson>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
