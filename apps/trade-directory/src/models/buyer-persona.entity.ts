import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity()
export class BuyerPersona extends AbstractEntity<BuyerPersona> {
  @Column({ type: 'varchar', nullable: true })
  buyerPersonaId?: string;

  @OneToOne(
    () => Organization,
    (organization) => organization.buyerPersona,
    { cascade: ['insert', 'update'] },
  )
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
