import { LendingProductEnum } from '@app/common/apps/trade-directory/enums/lending-product.enum';
import { LendingProductSubscriptionStatusEnum } from '@app/common/apps/trade-directory/enums/lending-product-subscription-status.enum';
import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ClientPersona } from './client-persona.entity';
import { Contract } from './contract.entity';

// "A Client is a contracted party to the Funder and has subscribed to 1 or
// more lending products" (design doc §1). One row per client per product.
// Access (future dynamic RBAC): SUPER_ADMIN / RM_TEAM_LEAD manage.
@Entity()
@Unique(['clientPersonaId', 'product'])
export class LendingProductSubscription extends AbstractEntity<LendingProductSubscription> {
  // Tenant scope.
  @Index()
  @Column({ type: 'integer' })
  funderPersonaId: number;

  @ManyToOne(() => ClientPersona, { nullable: false })
  @JoinColumn({ name: 'clientPersonaId' })
  clientPersona?: ClientPersona;

  @RelationId(
    (subscription: LendingProductSubscription) => subscription.clientPersona,
  )
  @Column({ type: 'integer' })
  clientPersonaId: number;

  @Column({
    type: 'enum',
    enum: LendingProductEnum,
    enumName: 'LendingProductEnum',
  })
  product: LendingProductEnum;

  // The facility agreement backing this subscription, once signed.
  @ManyToOne(() => Contract, { nullable: true })
  @JoinColumn({ name: 'facilityContractId' })
  facilityContract?: Contract;

  @RelationId(
    (subscription: LendingProductSubscription) =>
      subscription.facilityContract,
  )
  @Column({ type: 'integer', nullable: true })
  facilityContractId?: number;

  @Column({
    type: 'enum',
    enum: LendingProductSubscriptionStatusEnum,
    enumName: 'LendingProductSubscriptionStatusEnum',
    default: LendingProductSubscriptionStatusEnum.ACTIVE,
  })
  status: LendingProductSubscriptionStatusEnum;

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
