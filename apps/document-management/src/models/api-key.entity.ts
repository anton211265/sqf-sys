import { AbstractEntity } from '@app/common/database/abstract.entity';
import { Column, CreateDateColumn, Entity } from 'typeorm';

@Entity()
export class ApiKey extends AbstractEntity<ApiKey> {
  @Column({ unique: true })
  encryptedKey: string;

  @Column({ unique: true })
  hashedKey: string;

  @Column()
  name: string;

  @Column()
  orgId: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: true })
  isActive: boolean;
}
