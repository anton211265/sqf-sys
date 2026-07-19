import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { StoredDocument } from '../models/document.entity';

@Injectable()
export class DocumentRepository extends AbstractRepository<StoredDocument> {
  protected readonly logger = new Logger(DocumentRepository.name);

  constructor(
    @InjectRepository(StoredDocument)
    documentRepository: Repository<StoredDocument>,
    entityManager: EntityManager,
  ) {
    super(documentRepository, entityManager);
  }
}
