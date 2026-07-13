import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BuyerPersona } from '../models';

export class BuyerPersonaRepository extends AbstractRepository<BuyerPersona> {
  protected readonly logger = new Logger(BuyerPersona.name);

  constructor(
    @InjectRepository(BuyerPersona)
    repository: Repository<BuyerPersona>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
