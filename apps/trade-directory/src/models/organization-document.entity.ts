import { OrganizationDocumentTypeEnum } from '@app/common/apps/trade-directory/enums/organization-document-type.enum';
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
import { Organization } from './organization.entity';
import { Person } from './person.entity';

// An organization-level artefact (registration certs, tax certs, audited
// financials, ...) stored in S3. Added 2026-07-14 per docs/design decision:
// bank account details belong to the future Payment service, not here —
// see CLAUDE.md "Bank account data belongs to the Payment service".
@Entity()
export class OrganizationDocument extends AbstractEntity<OrganizationDocument> {
  @ManyToOne(
    () => Organization,
    (organization) => organization.organizationDocuments,
    { nullable: false },
  )
  @JoinColumn({ name: 'organizationId' })
  organization?: Organization;

  @RelationId(
    (document: OrganizationDocument) => document.organization,
  )
  @Index()
  @Column({ type: 'integer' })
  organizationId: number;

  @Column({
    type: 'enum',
    enum: OrganizationDocumentTypeEnum,
    enumName: 'OrganizationDocumentTypeEnum',
  })
  documentType: OrganizationDocumentTypeEnum;

  @Column({ type: 'varchar' })
  bucketName: string;

  // S3 object key for the stored file.
  @Column({ type: 'varchar' })
  objectKey: string;

  @Column({ type: 'varchar' })
  fileName: string;

  @Column({ type: 'varchar', nullable: true })
  mimeType?: string;

  @Column({ type: 'integer', nullable: true })
  fileSizeBytes?: number;

  @ManyToOne(() => Person, { nullable: true })
  @JoinColumn({ name: 'uploadedByPersonId' })
  uploadedByPerson?: Person;

  @RelationId(
    (document: OrganizationDocument) => document.uploadedByPerson,
  )
  @Column({ type: 'integer', nullable: true })
  uploadedByPersonId?: number;

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
