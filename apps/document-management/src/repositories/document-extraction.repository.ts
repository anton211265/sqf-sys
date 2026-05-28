import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { DocumentExtraction } from '../models/document-extraction.entity';

@Injectable()
export class DocumentExtractionRepository extends AbstractRepository<DocumentExtraction> {
  protected readonly logger = new Logger(DocumentExtractionRepository.name);

  constructor(
    @InjectRepository(DocumentExtraction)
    documentExtractionRepository: Repository<DocumentExtraction>,
    entityManager: EntityManager,
  ) {
    super(documentExtractionRepository, entityManager);
  }
}
