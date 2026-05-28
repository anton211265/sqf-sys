import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Facility } from '../models';

export class FacilityRepository extends AbstractRepository<Facility> {
  protected readonly logger = new Logger(Facility.name);

  constructor(
    @InjectRepository(Facility)
    repository: Repository<Facility>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
