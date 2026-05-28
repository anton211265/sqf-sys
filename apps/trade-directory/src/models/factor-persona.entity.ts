import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity()
export class FactorPersona extends AbstractEntity<FactorPersona> {
  @Column({ type: 'varchar', nullable: true })
  factorPersonaId?: string;

  @OneToOne(() => Organization, (organization) => organization.factorPersona, {
    cascade: ['insert', 'update'],
  })
  organization?: Organization;

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
