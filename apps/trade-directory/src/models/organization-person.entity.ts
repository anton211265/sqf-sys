import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizationPersonRole } from './organization-person-role.entity';
import { Organization } from './organization.entity';
import { Person } from './person.entity';

@Entity()
export class OrganizationPerson extends AbstractEntity<OrganizationPerson> {
  // ------------------------------------- SQF AI -------------------------------------

  // ------------------ Relationship ------------------

  @ManyToOne(
    () => Organization,
    (organization) => organization.organizationPersons,
    { cascade: ['insert', 'update'] },
  )
  organization?: Organization;
  @RelationId(
    (organizationPerson: OrganizationPerson) => organizationPerson.organization,
  )
  @Column({ nullable: false })
  organizationId?: number;

  @ManyToOne(() => Person, (person) => person.organizationPersons, {
    cascade: ['insert', 'update'],
  })
  person?: Person;
  @RelationId(
    (organizationPerson: OrganizationPerson) => organizationPerson.person,
  )
  @Column({ nullable: false })
  personId?: number;

  @OneToMany(
    () => OrganizationPersonRole,
    (organizationPersonRoles) => organizationPersonRoles.organizationPerson,
    {
      cascade: true,
    },
  )
  organizationPersonRoles?: OrganizationPersonRole[];

  // ------------------ Relationship ------------------

  @Column({ type: 'varchar', nullable: true })
  designation?: string;

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

  // MSAL-era field: Entra token subject. Still read by the legacy AUTHENTICATE
  // Kafka verification path in auth.service — remove together with that path.

  @Column({ type: 'varchar', nullable: true })
  sub?: string;
}
