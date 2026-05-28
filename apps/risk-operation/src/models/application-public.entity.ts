import { AbstractEntity } from '@app/common/database/abstract.entity';
import { Application } from 'apps/risk-operation/src/models';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ApplicationPublic extends AbstractEntity<ApplicationPublic> {
  @Column({ type: 'uuid' })
  uuid: string;

  @Column({ type: 'timestamp without time zone' })
  expiryDateTime: Date;

  @ManyToOne(
    () => Application,
    (application) => application.applicationPublics,
    {
      cascade: true,
    },
  )
  application?: Application;

  @RelationId(
    (applicationPublic: ApplicationPublic) => applicationPublic.application,
  )
  @Column({ nullable: false })
  applicationId: number;

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
