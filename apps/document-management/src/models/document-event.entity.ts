import { AbstractEntity } from '@app/common/database/abstract.entity';
import { DocumentEventTypeEnum } from '@app/common/apps/document-management/enums/document-status.enum';
import { Column, CreateDateColumn, Entity, Index } from 'typeorm';

// Append-only audit trail (same policy as trade-directory's auth_audit_log):
// rows are only ever inserted — no UPDATE or DELETE from application code.
@Entity('document_event')
export class DocumentEvent extends AbstractEntity<DocumentEvent> {
  @Index()
  @Column()
  documentId: number;

  @Column({ type: 'varchar', length: 50 })
  eventType: DocumentEventTypeEnum;

  // Null for system-initiated events.
  @Column({ nullable: true })
  actorPersonId?: number;

  @Column({ type: 'varchar', length: 30, nullable: true })
  beforeStatus?: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  afterStatus?: string;

  @Column({ type: 'jsonb', nullable: true })
  detail?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
