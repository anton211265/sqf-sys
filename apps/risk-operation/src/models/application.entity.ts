import { ApplicationStatusEnum } from '@app/common/apps/risk-operation/enums/application-status.enum';
import { UpdatableOrganizationPerson } from '@app/common/apps/trade-directory/types/organization-person.type';
import { Organization } from '@app/common/apps/trade-directory/types/organization.type';
import {
  Person,
  UpdatablePerson,
} from '@app/common/apps/trade-directory/types/person.type';
import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  UpdateDateColumn,
} from 'typeorm';
import { GuarantorDto } from '../sqf/application/dto/update-representative-details.dto';
import { ApplicationPersonaEnum } from '@app/common/apps/risk-operation/enums/application-persona.enum';
import { ApplicationPerson } from './application-person.entity';
import { RiskApplicationScoring } from './risk-application-scoring.entity';

@Entity()
export class Application extends AbstractEntity<Application> {
  // ------------------------------------- SQF AI -------------------------------------

  // ------------------ Microservice ------------------

  @Index()
  @Column({
    type: 'integer',
    nullable: false,
    default: 0,
  })
  organizationId: number;

  // ------------------ Microservice ------------------

  // ------------------ Relationship ------------------

  @OneToMany(
    () => ApplicationPerson,
    (applicationPerson) => applicationPerson.application,
  )
  applicationPersons: ApplicationPerson[];

  @OneToOne(() => RiskApplicationScoring, (scoring) => scoring.application, {
    cascade: true,
    eager: false,
  })
  riskApplicationScoring: RiskApplicationScoring;

  // ------------------ Relationship ------------------

  // ------------------ Columns ------------------

  @Column({ type: 'varchar' })
  clientOrganizationName: string;

  @Column({
    type: 'enum',
    enum: ApplicationStatusEnum,
    enumName: 'ApplicationStatusEnum',
    default: ApplicationStatusEnum.DRAFT,
  })
  applicationStatus: ApplicationStatusEnum;

  @Column({
    type: 'enum',
    enum: ApplicationPersonaEnum,
    enumName: 'ApplicationPersonaEnum',
    nullable: true,
  })
  applicationPersona: ApplicationPersonaEnum;

  @Column({ type: 'varchar', unique: true, nullable: true })
  applicationNumber: string;

  @Column({ type: 'timestamp without time zone', nullable: true })
  applicationDate?: Date;

  @Column({ type: 'jsonb', nullable: true })
  shareholders?: {
    person: UpdatablePerson;
    organizationPerson: UpdatableOrganizationPerson;
    shareholdingPercentage: number;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  guarantors?: GuarantorDto[];

  @Column({ type: 'jsonb', nullable: true })
  directors?: {
    person: UpdatablePerson;
    organizationPerson: UpdatableOrganizationPerson;
    authoriseSignatory?: boolean; // Note: to be fixed, make it as required
  }[];

  @Column({ type: 'jsonb', nullable: true })
  clientPersonInCharge?: {
    person: UpdatablePerson;
    organizationPerson: UpdatableOrganizationPerson;
  }[];

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

  // ------------------ Columns ------------------

  // ------------------------------------- SQF AI -------------------------------------

  // ------------------ Microservice references ------------------

  @Column({
    type: 'integer',
    nullable: true,
  })
  clientPersonaId: number;
  clientOrganization?: Organization;

  @Column({ type: 'varchar', nullable: true })
  remark?: string;

  // Tenant scope — every application belongs to one funder organization.
  @Column({
    type: 'integer',
    nullable: true,
  })
  funderPersonaId: number;
  funderOrganization: Organization;

  @Column({
    type: 'integer',
    nullable: true,
  })
  creatorPersonId: number;
  creatorPerson?: Person;

  // Work-queue assignment (relationship-manager queue filters on this).
  @Column({
    type: 'integer',
    nullable: true,
  })
  assigneePersonId: number;
  assigneePerson?: Person;

  // ------------------------------------- SQF AI -------------------------------------
}
