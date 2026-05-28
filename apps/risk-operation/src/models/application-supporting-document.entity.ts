import { ApplicationSupportingDocumentTypeEnum } from '@app/common/apps/risk-operation/enums/application-supporting-document-type.enum';
import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { Application } from './application.entity';
import { FinancialCreditReport } from './financial-credit-report.entity';

@Entity()
export class ApplicationSupportingDocument extends AbstractEntity<ApplicationSupportingDocument> {
  // ------------------ Relationship ------------------

  @ManyToOne(
    () => Application,
    (application) => application.applicationSupportingDocuments,
    {
      cascade: ['insert', 'update'],
    },
  )
  @JoinColumn({ name: 'application_id' }) // 👈 This maps the FK column name
  application: Application;

  @OneToMany(
    () => FinancialCreditReport,
    (creditReport) => creditReport.supportingDocument,
  )
  financialCreditReports?: FinancialCreditReport[];

  // ------------------ Relationship ------------------

  @Column({ name: 'application_id', type: 'integer' })
  applicationId: number;

  @Column({ name: 'file_name', type: 'varchar', nullable: true })
  fileName?: string;

  @Column({ name: 'file_extension', type: 'varchar', nullable: true })
  fileExtension?: string;

  @Column({
    name: 'supporting_document_type',
    type: 'enum',
    enum: ApplicationSupportingDocumentTypeEnum,
    enumName: 'ApplicationSupportingDocumentTypeEnum',
    nullable: true,
  })
  supportingDocumentType?: ApplicationSupportingDocumentTypeEnum;

  @Column({ name: 'bucket_key', type: 'varchar' })
  bucketKey: string;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: false })
  isActive: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
  })
  createdAt: Date;

  downloadUrl?: string;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
    onUpdate: 'LOCALTIMESTAMP',
  })
  updatedAt: Date;
}
