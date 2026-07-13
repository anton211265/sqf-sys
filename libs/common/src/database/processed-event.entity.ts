import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/**
 * Idempotency record: one row per outbox event id this service has already
 * consumed. Kafka delivers at-least-once, so consumers must check this table
 * before acting on a message and write to it in the same transaction as the
 * resulting business change.
 */
@Entity('processed_event')
export class ProcessedEvent {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'topic', type: 'varchar' })
  topic: string;

  @CreateDateColumn({
    name: 'processed_at',
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
  })
  processedAt: Date;

  constructor(entity: Partial<ProcessedEvent> = {}) {
    Object.assign(this, entity);
  }
}
