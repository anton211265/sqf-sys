import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ClientPersona } from '../models';

export class ClientPersonaRepository extends AbstractRepository<ClientPersona> {
  protected readonly logger = new Logger(ClientPersona.name);

  constructor(
    @InjectRepository(ClientPersona)
    repository: Repository<ClientPersona>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
