import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { Organization } from './organization.entity';
import { OrganizationPersonRole } from './organization-person-role.entity';
import { RolePermission } from './role-permission.entity';

/**
 * Dynamic role container (Dynamic RBAC, 2026-07-22): created/renamed/deleted
 * at runtime by each Funder's Super Admin. Tenant-scoped via organizationId.
 * isImmutable marks the per-org Super Admin role — it can never be renamed,
 * deleted, or stripped of its members' last holder (RbacService guards).
 */
@Entity()
@Unique(['organization', 'name'])
export class OrganizationRole {
  // ------------------------------------- SQF AI -------------------------------------

  // ------------------ Relationship ------------------

  @OneToMany(
    () => OrganizationPersonRole,
    (organizationPersonRole) => organizationPersonRole.role,
  )
  organizationPersonRoles: OrganizationPersonRole[]; // Inverse relationship (legacy enum path)

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  organization: Organization;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions?: RolePermission[];

  // ------------------ Relationship ------------------

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @Column({ default: false })
  isImmutable: boolean;

  @CreateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
    onUpdate: 'LOCALTIMESTAMP',
  })
  updatedAt: Date;

  // ------------------------------------- SQF AI -------------------------------------
}
