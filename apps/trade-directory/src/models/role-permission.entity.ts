import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  Unique,
} from 'typeorm';
import { OrganizationRole } from './organization-role.entity';
import { Permission } from './permission.entity';

/** Roles-to-permissions junction (Dynamic RBAC). */
@Entity()
@Unique(['role', 'permission'])
export class RolePermission extends AbstractEntity<RolePermission> {
  @ManyToOne(() => OrganizationRole, (role) => role.rolePermissions, {
    onDelete: 'CASCADE',
  })
  role: OrganizationRole;

  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  permission: Permission;

  @Column({ type: 'int', nullable: true })
  grantedByPersonId: number | null;

  @CreateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
  })
  createdAt: Date;
}
