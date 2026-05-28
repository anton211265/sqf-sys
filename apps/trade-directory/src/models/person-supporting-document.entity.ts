import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { PersonSupportingDocumentTypeEnum } from '../../../../libs/common/src/apps/trade-directory/enums/person-supporting-document';
import { Person } from './person.entity';

@Entity()
export class PersonSupportingDocument extends AbstractEntity<PersonSupportingDocument> {
  @Column({ type: 'varchar' })
  bucketKey: string;

  @Column({
    type: 'enum',
    enum: PersonSupportingDocumentTypeEnum,
    enumName: 'PersonSupportingDocumentTypeEnum',
  })
  supportingDocumentType: PersonSupportingDocumentTypeEnum;

  @ManyToOne(() => Person, (person) => person.personSupportingDocuments, {
    cascade: ['insert', 'update'],
  })
  person: Person;

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
