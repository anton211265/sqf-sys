import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Relationship } from '../models/relationship.entity';

@Injectable()
export class RelationshipRepository extends AbstractRepository<Relationship> {
  protected readonly logger = new Logger(Relationship.name);

  constructor(
    @InjectRepository(Relationship)
    repository: Repository<Relationship>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
