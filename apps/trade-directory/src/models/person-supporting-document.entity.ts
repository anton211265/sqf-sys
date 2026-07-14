import { PersonSupportingDocumentTypeEnum } from '@app/common/apps/trade-directory/enums/person-supporting-document';
import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { Person } from './person.entity';

// A supporting identity document for a Person (e.g. NRIC scan), stored in S3.
// Reintroduced 2026-07-14 — existed in the original 2024 schema, was dropped
// during the 2026-07-13 trade-directory redesign along with bank_account.
@Entity()
export class PersonSupportingDocument extends AbstractEntity<PersonSupportingDocument> {
  @ManyToOne(() => Person, (person) => person.supportingDocuments, {
    nullable: false,
  })
  @JoinColumn({ name: 'personId' })
  person?: Person;

  @RelationId(
    (document: PersonSupportingDocument) => document.person,
  )
  @Index()
  @Column({ type: 'integer' })
  personId: number;

  // S3 object key for the stored file.
  @Column({ type: 'varchar' })
  bucketKey: string;

  @Column({
    type: 'enum',
    enum: PersonSupportingDocumentTypeEnum,
    enumName: 'PersonSupportingDocumentTypeEnum',
  })
  supportingDocumentType: PersonSupportingDocumentTypeEnum;

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
