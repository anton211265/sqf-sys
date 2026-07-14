import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { OrganizationDocument } from '../models/organization-document.entity';

export class OrganizationDocumentRepository extends AbstractRepository<OrganizationDocument> {
  protected readonly logger = new Logger(OrganizationDocument.name);

  constructor(
    @InjectRepository(OrganizationDocument)
    repository: Repository<OrganizationDocument>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
