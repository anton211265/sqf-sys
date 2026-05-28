import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { WebhookLog } from './webhook-log.entity';
import { AbstractEntity } from '@app/common/database/abstract.entity';

export enum WebhookEventType {
  EXTRACTION = 'extraction',
  CONSENSUS_MESSAGING = 'consensus_messaging',
}

@Entity()
export class Webhook extends AbstractEntity<Webhook> {
  @Column({ unique: true })
  webhookId: string;

  @Column()
  name: string;

  @Column()
  orgId: string;

  @Column()
  url: string;

  @Column({
    type: 'enum',
    enum: WebhookEventType,
    array: true,
  })
  eventTypes: WebhookEventType[];

  @Column()
  encryptedApiKey: string;

  @Column()
  encryptedSecretKey: string;

  @OneToMany(() => WebhookLog, (webhookLog) => webhookLog.webhook)
  logs: WebhookLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: true })
  isActive: boolean;
}
