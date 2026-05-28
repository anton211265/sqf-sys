import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Person } from '../models';

export class PersonRepository extends AbstractRepository<Person> {
  protected readonly logger = new Logger(Person.name);

  constructor(
    @InjectRepository(Person)
    repository: Repository<Person>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
