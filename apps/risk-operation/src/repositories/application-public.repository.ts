import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ApplicationPublic } from '../models/application-public.entity';

export class ApplicationPublicRepository extends AbstractRepository<ApplicationPublic> {
  protected readonly logger = new Logger(ApplicationPublic.name);

  constructor(
    @InjectRepository(ApplicationPublic)
    repository: Repository<ApplicationPublic>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
