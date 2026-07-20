import { AbstractEntity } from '@app/common/database/abstract.entity';
import { DocumentClassEnum } from '@app/common/apps/document-management/enums/document-class.enum';
import {
  DocumentStatusEnum,
  ExtractionMethodEnum,
} from '@app/common/apps/document-management/enums/document-status.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  UpdateDateColumn,
} from 'typeorm';

// Class named StoredDocument (not Document) to avoid shadowing the DOM
// Document type; table stays "document".
@Entity('document')
export class StoredDocument extends AbstractEntity<StoredDocument> {
  // Also the S3 object filename — the design's "unique ID as the filename".
  @Column({ type: 'uuid', unique: true })
  documentUuid: string;

  // Organization the document is about (bare int, no cross-DB FK — standard
  // cross-service reference pattern). May differ from uploaderOrgId when an
  // RM uploads on a client's behalf.
  @Index()
  @Column()
  subjectOrganizationId: number;

  @Column()
  uploaderOrgId: number;

  @Column({ nullable: true })
  uploadedByPersonId?: number;

  @Index()
  @Column({ type: 'varchar', length: 40 })
  documentClass: DocumentClassEnum;

  @Index()
  @Column({ type: 'varchar', length: 30 })
  status: DocumentStatusEnum;

  // Caller-supplied correlation id (application, invoice, onboarding case).
  @Column({ type: 'varchar', length: 100, nullable: true })
  refId?: string;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column()
  fileSizeBytes: number;

  @Index()
  @Column({ type: 'char', length: 64 })
  sha256Hash: string;

  @Column({ type: 'varchar', length: 100 })
  bucketName: string;

  @Column({ type: 'varchar', length: 255 })
  objectKey: string;

  // Markitdown output when it was already produced during upload validation
  // (onboarding text-layer check) — saves Phase 2 a reconversion.
  @Column({ type: 'text', nullable: true })
  rawText?: string;

  // Structured fields extracted by Claude per the document class's
  // extraction target (see modules/documents/extraction-targets.ts).
  @Column({ type: 'jsonb', nullable: true })
  extractedData?: Record<string, unknown>;

  @Column({ type: 'varchar', length: 20, nullable: true })
  extractionMethod?: ExtractionMethodEnum;

  @Column({ type: 'text', nullable: true })
  extractionError?: string;

  // Cross-validation outcome (per-field verdicts incl. method + reasoning)
  // — see modules/documents/cross-validation.service.ts.
  @Column({ type: 'jsonb', nullable: true })
  validationResult?: Record<string, unknown>;

  @Column({ type: 'timestamp', nullable: true })
  extractedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
