import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Webhook } from './webhook.entity';
import { AbstractEntity } from '@app/common/database/abstract.entity';

export enum WebhookLogStatus {
  FAILED = 'failed',
  SENT = 'sent',
}

@Entity()
export class WebhookLog extends AbstractEntity<WebhookLog> {
  @Column({ type: 'json' })
  requestBody: any;

  @Column()
  eventType: string;

  @Column({ type: 'enum', enum: WebhookLogStatus })
  status: WebhookLogStatus;

  @Column()
  url: string;

  @Column()
  requestId: string;

  @Column({ type: 'int', nullable: true })
  responseStatus?: number;

  @Column({ type: 'json', nullable: true })
  responseBody?: any;

  @Column({ type: 'json', nullable: true })
  responseHeaders?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Webhook, (webhook) => webhook.logs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'webhookId' })
  webhook: Webhook;
}
