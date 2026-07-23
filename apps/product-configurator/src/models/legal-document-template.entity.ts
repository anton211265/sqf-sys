import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

/**
 * Legal document templates (spec §3 "legal_document_templates").
 * templateBody is a dev-stage addition: storing the Handlebars source inline
 * makes the injection previewer work end-to-end before S3-backed template
 * files land (templateFileUrl stays for that phase).
 */
@Entity('legal_document_template')
@Unique('UQ_template_funder_code', ['funderOrganizationId', 'documentCode'])
export class LegalDocumentTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  documentCode: string;

  @Column({ type: 'varchar', length: 150 })
  documentName: string;

  @Column({ type: 'varchar', nullable: true })
  templateFileUrl: string | null;

  @Column({ type: 'text', nullable: true })
  templateBody: string | null;

  @Column({ type: 'boolean', default: true })
  isRequiredDefault: boolean;

  @Column({ type: 'integer' })
  funderOrganizationId: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'LOCALTIMESTAMP' })
  createdAt: Date;
}
