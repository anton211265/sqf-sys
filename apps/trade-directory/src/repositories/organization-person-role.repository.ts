import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { OrganizationPersonRole } from '../models';

export class OrganizationPersonRoleRepository extends AbstractRepository<OrganizationPersonRole> {
  protected readonly logger = new Logger(OrganizationPersonRole.name);

  constructor(
    @InjectRepository(OrganizationPersonRole)
    repository: Repository<OrganizationPersonRole>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
