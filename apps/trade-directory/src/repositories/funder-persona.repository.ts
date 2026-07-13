import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { FunderPersona } from '../models';

export class FunderPersonaRepository extends AbstractRepository<FunderPersona> {
  protected readonly logger = new Logger(FunderPersona.name);

  constructor(
    @InjectRepository(FunderPersona)
    repository: Repository<FunderPersona>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
