import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ClientAwarderContract } from '../models';

export class ClientAwarderContractRepository extends AbstractRepository<ClientAwarderContract> {
  protected readonly logger = new Logger(ClientAwarderContract.name);

  constructor(
    @InjectRepository(ClientAwarderContract)
    repository: Repository<ClientAwarderContract>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
