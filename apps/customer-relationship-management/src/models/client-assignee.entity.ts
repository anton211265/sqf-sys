import { Organization } from '@app/common/apps/trade-directory/types/organization.type';
import { Person } from '@app/common/apps/trade-directory/types/person.type';
import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ClientAssignee extends AbstractEntity<ClientAssignee> {
  @Index({ unique: true })
  @Column({ type: 'integer' })
  clientPersonaId: number;

  @Column({ type: 'varchar' })
  clientOrganizationName: string;

  clientOrganization?: Organization;

  @Column({ type: 'integer', nullable: true })
  assigneePersonId: number;

  assigneePerson?: Person;

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
}
