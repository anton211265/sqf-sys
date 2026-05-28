import { OrganizationPersonRoleEnum } from '@app/common/apps/trade-directory/enums/organization-person-role.enum';
import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizationPerson } from './organization-person.entity';
import { OrganizationRole } from './organization-role.entity';

@Entity()
export class OrganizationPersonRole extends AbstractEntity<OrganizationPersonRole> {
  // ------------------------------------- SQF AI -------------------------------------

  // ------------------ Relationship ------------------

  @ManyToOne(
    () => OrganizationPerson,
    (organizationPerson) => organizationPerson.organizationPersonRoles,
    {
      cascade: ['insert', 'update'],
    },
  )
  @JoinColumn({ name: 'organizationPersonId' })
  organizationPerson?: OrganizationPerson;

  @RelationId(
    (organizationPersonRole: OrganizationPersonRole) =>
      organizationPersonRole.organizationPerson,
  )
  organizationPersonId?: number;

  @ManyToOne(
    () => OrganizationRole,
    (organizationRole) => organizationRole.organizationPersonRoles,
    {
      cascade: false,
      nullable: true,
    },
  )
  @JoinColumn({ name: 'roleId' })
  organizationRole: OrganizationRole;

  @RelationId(
    (organizationPersonRole: OrganizationPersonRole) =>
      organizationPersonRole.organizationRole,
  )
  organizationRoleId: number;

  // ------------------ Relationship ------------------

  @Column({
    type: 'enum',
    enum: OrganizationPersonRoleEnum,
    enumName: 'OrganizationPersonRoleEnum',
  })
  role: OrganizationPersonRoleEnum;

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
