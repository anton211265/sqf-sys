import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BankAccount } from '../models';

export class BankAccountRepository extends AbstractRepository<BankAccount> {
  protected readonly logger = new Logger(BankAccount.name);

  constructor(
    @InjectRepository(BankAccount)
    repository: Repository<BankAccount>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
