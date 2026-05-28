import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { FactorPersona } from '../models';

export class FactorPersonaRepository extends AbstractRepository<FactorPersona> {
  protected readonly logger = new Logger(FactorPersona.name);

  constructor(
    @InjectRepository(FactorPersona)
    repository: Repository<FactorPersona>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
