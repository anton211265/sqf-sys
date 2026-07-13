import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum DocumentRequestStatusEnum {
  PENDING = 'PENDING',
  RECEIVED = 'RECEIVED',
  OVERDUE = 'OVERDUE',
  ESCALATED = 'ESCALATED',
}

/**
 * Tracks the documents the Risk Agent asked a client for after selecting a
 * screening filter, plus the SLA clock. dueAt is set from the filter's
 * configured response window; the SLA cron (DocumentRequestService) flips
 * status to OVERDUE/ESCALATED and emits a SEND_EMAIL outbox event to the HRA.
 */
@Entity('document_request')
export class DocumentRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'application_id', type: 'integer' })
  applicationId: number;

  @Column({ name: 'application_number', type: 'varchar' })
  applicationNumber: string;

  @Column({ name: 'document_types', type: 'jsonb' })
  documentTypes: string[];

  @Column({
    name: 'status',
    type: 'enum',
    enum: DocumentRequestStatusEnum,
    enumName: 'DocumentRequestStatusEnum',
    default: DocumentRequestStatusEnum.PENDING,
  })
  status: DocumentRequestStatusEnum;

  @Column({ name: 'sla_days', type: 'integer' })
  slaDays: number;

  @Column({ name: 'due_at', type: 'timestamp without time zone' })
  dueAt: Date;

  @Column({ name: 'escalated_at', type: 'timestamp without time zone', nullable: true })
  escalatedAt: Date | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
  })
  createdAt: Date;

  constructor(entity: Partial<DocumentRequest> = {}) {
    Object.assign(this, entity);
  }
}
