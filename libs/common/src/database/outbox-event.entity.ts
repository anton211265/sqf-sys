import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

export enum OutboxEventStatusEnum {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

/**
 * Transactional outbox: written in the same DB transaction as the business
 * change it describes, then published to Kafka by a relay (see
 * OutboxRelayService). This avoids the dual-write problem between a
 * service's own database and Kafka.
 */
@Entity('outbox_event')
export class OutboxEvent {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'topic', type: 'varchar' })
  topic: string;

  @Column({ name: 'payload', type: 'jsonb' })
  payload: Record<string, unknown>;

  @Index()
  @Column({
    name: 'status',
    type: 'enum',
    enum: OutboxEventStatusEnum,
    enumName: 'OutboxEventStatusEnum',
    default: OutboxEventStatusEnum.PENDING,
  })
  status: OutboxEventStatusEnum;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
  })
  createdAt: Date;

  @Column({
    name: 'sent_at',
    type: 'timestamp without time zone',
    nullable: true,
  })
  sentAt: Date | null;

  constructor(entity: Partial<OutboxEvent> = {}) {
    Object.assign(this, entity);
  }
}
