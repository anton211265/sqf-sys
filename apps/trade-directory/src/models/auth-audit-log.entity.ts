import { Column, Entity, Generated, PrimaryColumn } from 'typeorm';

export enum AuthAuditEvent {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGIN_LOCKED = 'LOGIN_LOCKED',
  LOGIN_BLOCKED = 'LOGIN_BLOCKED',
  REFRESH_SUCCESS = 'REFRESH_SUCCESS',
  REFRESH_FAILURE = 'REFRESH_FAILURE',
  REFRESH_THEFT = 'REFRESH_THEFT',
  LOGOUT = 'LOGOUT',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

@Entity({ name: 'auth_audit_log' })
export class AuthAuditLog {
  @PrimaryColumn({ type: 'uuid' })
  @Generated('uuid')
  id: string;

  @Column({ type: 'varchar' })
  event: AuthAuditEvent;

  @Column({ type: 'int', nullable: true })
  personId: number | null;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  ipAddress: string | null;

  @Column({ type: 'varchar', nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar' })
  outcome: 'SUCCESS' | 'FAILURE';

  @Column({ type: 'varchar', nullable: true })
  detail: string | null;

  @Column({
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
  })
  createdAt: Date;
}
