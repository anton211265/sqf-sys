import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ApplicationSupportingDocument } from '../models';

export class ApplicationSupportingDocumentRepository extends AbstractRepository<ApplicationSupportingDocument> {
  protected readonly logger = new Logger(ApplicationSupportingDocument.name);

  constructor(
    @InjectRepository(ApplicationSupportingDocument)
    repository: Repository<ApplicationSupportingDocument>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
