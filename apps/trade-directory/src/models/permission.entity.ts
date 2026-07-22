import { AbstractEntity } from '@app/common/database/abstract.entity';
import { Column, CreateDateColumn, Entity } from 'typeorm';

/**
 * Code-owned dictionary of functional capabilities (Dynamic RBAC, 2026-07-22).
 * Rows are seeded by migration and ship with the platform — the Super Admin
 * portal composes roles FROM these keys but never creates/edits them.
 * permKey format: domain_action_subaction (e.g. 'risk_models_edit').
 */
@Entity()
export class Permission extends AbstractEntity<Permission> {
  @Column({ unique: true })
  permKey: string;

  // Accordion grouping in the Role Builder (e.g. 'Credit Risk')
  @Column()
  permCategory: string;

  // Plain-English tooltip text for administrators
  @Column()
  permDescription: string;

  @CreateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
  })
  createdAt: Date;
}
