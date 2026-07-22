import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PersonRole } from '../models';

export class PersonRoleRepository extends AbstractRepository<PersonRole> {
  protected readonly logger = new Logger(PersonRole.name);

  constructor(
    @InjectRepository(PersonRole)
    repository: Repository<PersonRole>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }

  /** All assignments a person holds within one organization's roles. */
  findByPersonInOrg(personId: number, organizationId: number): Promise<PersonRole[]> {
    return this.find({
      where: {
        person: { id: personId },
        role: { organization: { id: organizationId } },
      },
      relations: ['role', 'role.organization', 'person'],
    });
  }

  findByRoleId(roleId: number): Promise<PersonRole[]> {
    return this.find({
      where: { role: { id: roleId } },
      relations: ['person', 'role'],
    });
  }
}
