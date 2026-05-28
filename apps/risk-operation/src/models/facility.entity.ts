import { FacilityTypeEnum } from '@app/common/apps/risk-operation/enums/facility-type.enum';
import { AbstractEntity } from '@app/common/database/abstract.entity';
import { NumericTransformer } from '@app/common/utils/numeric-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { Application } from './application.entity';

@Entity()
export class Facility extends AbstractEntity<Facility> {
  @ManyToOne(() => Application, (application) => application.facilities, {
    cascade: ['insert', 'update'],
  })
  application?: Application[];

  @Column({
    type: 'enum',
    enum: FacilityTypeEnum,
    enumName: 'FacilityTypeEnum',
  })
  facilityType: FacilityTypeEnum;

  @Column({
    type: 'numeric',
    transformer: new NumericTransformer(),
  })
  facilityLimit: number;

  @Column({ type: 'varchar', nullable: true })
  remark?: string;

  // percentage
  @Column({
    type: 'numeric',
    transformer: new NumericTransformer(),
  })
  marginOfFactoring: number;

  @Column({
    type: 'timestamp without time zone',
  })
  creditPeriodEndDate: Date;

  @Column({
    type: 'timestamp without time zone',
  })
  gracePeriodEndDate: Date;

  // percentage
  @Column({
    type: 'numeric',
    transformer: new NumericTransformer(),
  })
  profitRateT1: number;

  // percentage
  @Column({
    type: 'numeric',
    transformer: new NumericTransformer(),
  })
  profitRateT2: number;

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
