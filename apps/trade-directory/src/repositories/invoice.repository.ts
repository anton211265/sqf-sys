import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Invoice } from '../models/invoice.entity';

@Injectable()
export class InvoiceRepository extends AbstractRepository<Invoice> {
  protected readonly logger = new Logger(Invoice.name);

  constructor(
    @InjectRepository(Invoice)
    repository: Repository<Invoice>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
