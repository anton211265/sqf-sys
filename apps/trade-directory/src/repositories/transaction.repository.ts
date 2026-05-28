import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Transaction } from '../models/transaction.entity';

export class TransactionRepository extends AbstractRepository<Transaction> {
  protected readonly logger = new Logger(Transaction.name);

  constructor(
    @InjectRepository(Transaction)
    repository: Repository<Transaction>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
