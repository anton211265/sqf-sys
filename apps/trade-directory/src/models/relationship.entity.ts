import { RelationshipStatusEnum } from '@app/common/apps/trade-directory/enums/relationship-status.enum';
import { RelationshipTypeEnum } from '@app/common/apps/trade-directory/enums/relationship-type.enum';
import { CurrencyCodeEnum } from '@app/common/constants/currencies';
import { AbstractEntity } from '@app/common/database/abstract.entity';
import { NumericTransformer } from '@app/common/utils/numeric-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Organization } from './organization.entity';

// Org-to-org trading relationship — the core of the trade directory network.
// Directional: from = supplier side, to = buyer side (see RelationshipTypeEnum).
// Access (future dynamic RBAC): RELATIONSHIP_MANAGER manage, RISK_OFFICER read.
@Entity()
@Unique(['fromOrganizationId', 'toOrganizationId', 'relationshipType'])
export class Relationship extends AbstractEntity<Relationship> {
  // Tenant scope — every relationship belongs to one funder's directory.
  @Index()
  @Column({ type: 'integer' })
  funderPersonaId: number;

  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: 'fromOrganizationId' })
  fromOrganization?: Organization;

  @RelationId((relationship: Relationship) => relationship.fromOrganization)
  @Column({ type: 'integer' })
  fromOrganizationId: number;

  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: 'toOrganizationId' })
  toOrganization?: Organization;

  @RelationId((relationship: Relationship) => relationship.toOrganization)
  @Column({ type: 'integer' })
  toOrganizationId: number;

  @Column({
    type: 'enum',
    enum: RelationshipTypeEnum,
    enumName: 'RelationshipTypeEnum',
    default: RelationshipTypeEnum.SUPPLIES_TO,
  })
  relationshipType: RelationshipTypeEnum;

  @Column({ type: 'integer', nullable: true })
  paymentTermsDays?: number;

  // Year-over-year traded-volume change — feeds the knowledge-graph
  // term-loan opportunity pattern (design doc §4.3).
  @Column({
    type: 'numeric',
    precision: 8,
    scale: 2,
    nullable: true,
    transformer: new NumericTransformer(),
  })
  yearlyVolumeChangePct?: number;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: new NumericTransformer(),
  })
  totalTradeVolume?: number;

  @Column({
    type: 'enum',
    enum: CurrencyCodeEnum,
    enumName: 'CurrencyCodeEnum',
    nullable: true,
  })
  tradeCurrency?: CurrencyCodeEnum;

  @Column({
    type: 'enum',
    enum: RelationshipStatusEnum,
    enumName: 'RelationshipStatusEnum',
    default: RelationshipStatusEnum.ACTIVE,
  })
  status: RelationshipStatusEnum;

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
