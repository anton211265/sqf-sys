import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ContractAwarderPersona } from '../models';

export class ContractAwarderPersonaRepository extends AbstractRepository<ContractAwarderPersona> {
  protected readonly logger = new Logger(ContractAwarderPersona.name);

  constructor(
    @InjectRepository(ContractAwarderPersona)
    repository: Repository<ContractAwarderPersona>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
