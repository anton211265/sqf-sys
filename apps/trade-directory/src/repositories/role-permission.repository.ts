import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { RolePermission } from '../models';

export class RolePermissionRepository extends AbstractRepository<RolePermission> {
  protected readonly logger = new Logger(RolePermission.name);

  constructor(
    @InjectRepository(RolePermission)
    repository: Repository<RolePermission>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }

  findByRoleId(roleId: number): Promise<RolePermission[]> {
    return this.find({
      where: { role: { id: roleId } },
      relations: ['permission', 'role'],
    });
  }
}
