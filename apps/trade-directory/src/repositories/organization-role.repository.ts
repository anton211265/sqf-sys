import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { OrganizationRole } from '../models';

export class OrganizationRoleRepository extends AbstractRepository<OrganizationRole> {
  protected readonly logger = new Logger(OrganizationRole.name);

  constructor(
    @InjectRepository(OrganizationRole)
    repository: Repository<OrganizationRole>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }

  findByOrganization(organizationId: number): Promise<OrganizationRole[]> {
    return this.find({
      where: { organization: { id: organizationId } },
      relations: ['organization'],
    });
  }

  findOneInOrganization(
    roleId: number,
    organizationId: number,
  ): Promise<OrganizationRole | null> {
    return this.findOne({
      where: { id: roleId, organization: { id: organizationId } },
      relations: ['organization'],
    });
  }
}
