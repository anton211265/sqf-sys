import { AbstractEntity } from '@app/common/database/abstract.entity';
import { Column, CreateDateColumn, Entity, UpdateDateColumn } from 'typeorm';

export enum OnchainStatus {
  PENDING_WEBHOOK = 'pending_webhook',
  FAILED = 'failed',
  COMPLETED = 'completed',
  PARTIAL_COMPLETED = 'partial_completed',
}

export interface OnchainAttributes {
  dataType: string;
  hash: string;
}

export enum OnchainInternalType {
  TEST = 'test',
}

@Entity()
export class Onchain extends AbstractEntity<Onchain> {
  @Column({ unique: true })
  requestId: string;

  @Column()
  refId: string;

  @Column()
  orgId: string;

  @Column()
  topicId: string;

  @Column()
  transactionId: string;

  @Column()
  url: string;

  @Column()
  eventName: string;

  @Column({ type: 'enum', enum: OnchainStatus })
  status: OnchainStatus;

  @Column({ type: 'text', nullable: true })
  error?: string;

  @Column()
  isInternal: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
