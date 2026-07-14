import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PersonSupportingDocument } from '../models/person-supporting-document.entity';

export class PersonSupportingDocumentRepository extends AbstractRepository<PersonSupportingDocument> {
  protected readonly logger = new Logger(PersonSupportingDocument.name);

  constructor(
    @InjectRepository(PersonSupportingDocument)
    repository: Repository<PersonSupportingDocument>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}
