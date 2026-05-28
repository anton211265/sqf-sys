import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ClientAssignee } from '../models/client-assignee.entity';

export class ClientAssigneeRepository extends AbstractRepository<ClientAssignee> {
  protected readonly logger = new Logger(ClientAssignee.name);

  constructor(
    @InjectRepository(ClientAssignee)
    repository: Repository<ClientAssignee>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
