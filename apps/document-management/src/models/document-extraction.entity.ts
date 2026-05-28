import { LLMProvider } from '@app/common/apps/common/enums/llm.enum';
import { AbstractEntity } from '@app/common/database/abstract.entity';
import { Column, CreateDateColumn, Entity, UpdateDateColumn } from 'typeorm';

export enum DocumentExtractionStatus {
  PENDING_OCR = 'pending_ocr',
  PENDING_LLM_EXTRACTION = 'pending_llm_extraction',
  PENDING_WEBHOOK = 'pending_webhook',
  FAILED = 'failed',
  COMPLETED = 'completed',
  PARTIAL_COMPLETED = 'partial_completed',
}

export enum DocumentExtractionInternalType {
  TEST = 'test',
}

@Entity()
export class DocumentExtraction extends AbstractEntity<DocumentExtraction> {
  @Column({ unique: true })
  requestId: string;

  @Column()
  orgId: string;

  @Column()
  refId: string;

  @Column({ type: 'enum', enum: DocumentExtractionStatus })
  status: DocumentExtractionStatus;

  @Column()
  templateId: string;

  @Column()
  documentType: string;

  @Column()
  fileName: string;

  @Column()
  jobId: string;

  @Column()
  filePath: string;

  @Column({ nullable: true })
  pages?: number;

  @Column({ nullable: true })
  tokens?: number;

  @Column({ type: 'text', nullable: true })
  rawText?: string;

  @Column({ type: 'json', nullable: true })
  extractedData?: any;

  @Column({ type: 'text', nullable: true })
  error?: string;

  @Column()
  isInternal: boolean;

  @Column({ type: 'enum', enum: LLMProvider, nullable: true })
  llmProvider?: LLMProvider;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
