import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { DocumentEvent } from '../models/document-event.entity';

// Write-only repository — document_event is an append-only audit trail.
// Deliberately does not extend AbstractRepository: no findOneAndUpdate/delete
// surface should exist for this table.
@Injectable()
export class DocumentEventRepository {
  constructor(
    @InjectRepository(DocumentEvent)
    private readonly documentEventRepository: Repository<DocumentEvent>,
  ) {}

  async record(
    event: Partial<DocumentEvent>,
    manager?: EntityManager,
  ): Promise<DocumentEvent> {
    const entity = new DocumentEvent(event);
    if (manager) {
      return manager.save(entity);
    }
    return this.documentEventRepository.save(entity);
  }

  async findByDocumentId(documentId: number): Promise<DocumentEvent[]> {
    return this.documentEventRepository.find({
      where: { documentId },
      order: { createdAt: 'ASC' },
    });
  }
}
