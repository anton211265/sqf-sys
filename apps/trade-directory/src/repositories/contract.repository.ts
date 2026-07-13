import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Contract } from '../models/contract.entity';

@Injectable()
export class ContractRepository extends AbstractRepository<Contract> {
  protected readonly logger = new Logger(Contract.name);

  constructor(
    @InjectRepository(Contract)
    repository: Repository<Contract>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
