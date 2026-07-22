import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  Unique,
} from 'typeorm';
import { OrganizationRole } from './organization-role.entity';
import { Person } from './person.entity';

/**
 * Users-to-roles junction (Dynamic RBAC). Replaces the enum-based
 * organization_person_role for new work — the role's own organizationId
 * carries the tenant scope, and RbacService enforces that the person is a
 * member of that organization at assignment time.
 */
@Entity()
@Unique(['person', 'role'])
export class PersonRole extends AbstractEntity<PersonRole> {
  @ManyToOne(() => Person, { onDelete: 'CASCADE' })
  person: Person;

  @ManyToOne(() => OrganizationRole, { onDelete: 'CASCADE' })
  role: OrganizationRole;

  @Column({ type: 'int', nullable: true })
  assignedByPersonId: number | null;

  @CreateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
  })
  createdAt: Date;
}
