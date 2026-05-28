import { AbstractEntity } from '@app/common/database/abstract.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class ResetPasswordToken extends AbstractEntity<ResetPasswordToken> {
  @Column()
  email: string;

  @Column({ unique: true })
  token: string;

  @Column()
  tokenExpirationAt: Date;
}
