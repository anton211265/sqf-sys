import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Permission } from '../models';

export class PermissionRepository extends AbstractRepository<Permission> {
  protected readonly logger = new Logger(Permission.name);

  constructor(
    @InjectRepository(Permission)
    repository: Repository<Permission>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
