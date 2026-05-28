import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  RelationId,
} from 'typeorm';
import { Application } from './application.entity';
import { ApplicationPersonTypeEnum } from '@app/common/apps/risk-operation/enums/application-person-type.enum';
import { AbstractEntity } from '@app/common/database/abstract.entity';

@Entity()
export class ApplicationPerson extends AbstractEntity<ApplicationPerson> {
  // ------------------------------------- SQF AI -------------------------------------

  // ------------------ Microservice ------------------

  @Column({ type: 'integer', nullable: false })
  organizationPersonId: number;

  // ------------------ Microservice ------------------

  // ------------------ Relationship ------------------

  @ManyToOne(
    () => Application,
    (application) => application.applicationPersons,
    {
      cascade: ['insert', 'update'],
      nullable: false, // Ensure applicationId is required
    },
  )
  @JoinColumn({ name: 'applicationId' }) // Link the foreign key column
  application: Application;

  @RelationId(
    (applicationPerson: ApplicationPerson) => applicationPerson.application,
  )
  applicationId: number; // Automatically maps the foreign key from the relationship

  // ------------------ Relationship ------------------

  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ApplicationPersonTypeEnum,
    enumName: 'ApplicationPersonTypeEnum',
    nullable: false,
  })
  applicationPersonType: ApplicationPersonTypeEnum;

  // @Column({ type: 'jsonb', nullable: true })
  // roles: string[];

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
