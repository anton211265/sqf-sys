import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { SupplierPersona } from '../models';

export class SupplierPersonaRepository extends AbstractRepository<SupplierPersona> {
  protected readonly logger = new Logger(SupplierPersona.name);

  constructor(
    @InjectRepository(SupplierPersona)
    repository: Repository<SupplierPersona>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
