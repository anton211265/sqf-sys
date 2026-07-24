import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Read-model of a web-intake application (Customer Portal pass 1) for the
 * RM Supervisor queue. risk-operation owns the application lifecycle; this
 * projection is upserted by the APPLICATION_SCORED consumer. The RM
 * assignment column is CRM-owned state.
 */
@Entity('applicant_intake')
export class ApplicantIntake {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  funderOrganizationId: number;

  @Column({ type: 'integer', unique: true })
  applicationId: number;

  @Column({ type: 'varchar' })
  applicationNumber: string;

  @Column({ type: 'integer' })
  organizationId: number;

  @Column({ type: 'varchar', nullable: true })
  companyName: string | null;

  @Column({ type: 'varchar', nullable: true })
  productCode: string | null;

  @Column({ type: 'numeric', nullable: true })
  filter1Score: string | null;

  @Column({ type: 'varchar', nullable: true })
  filter1Category: string | null;

  @Column({ type: 'varchar' })
  result: 'PASS' | 'FAIL';

  @Column({ type: 'boolean', default: false })
  overridden: boolean;

  @Column({ type: 'integer', nullable: true })
  assignedRmPersonId: number | null;

  @Column({ type: 'timestamp without time zone', nullable: true })
  submittedAt: Date | null;

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
