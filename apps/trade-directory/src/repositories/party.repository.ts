import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Party } from '../models/party.entity';

@Injectable()
export class PartyRepository extends AbstractRepository<Party> {
  protected readonly logger = new Logger(Party.name);

  constructor(
    @InjectRepository(Party)
    repository: Repository<Party>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
