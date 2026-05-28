import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { OrganizationPersonRole } from './organization-person-role.entity';

@Entity()
export class OrganizationRole {
  // ------------------------------------- SQF AI -------------------------------------

  // ------------------ Relationship ------------------

  @OneToMany(
    () => OrganizationPersonRole,
    (organizationPersonRole) => organizationPersonRole.role,
  )
  organizationPersonRoles: OrganizationPersonRole[]; // Inverse relationship

  // ------------------ Relationship ------------------

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

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
