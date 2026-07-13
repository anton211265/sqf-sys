import { ContractStatusEnum } from '@app/common/apps/trade-directory/enums/contract-status.enum';
import { ContractTypeEnum } from '@app/common/apps/trade-directory/enums/contract-type.enum';
import { LendingProductEnum } from '@app/common/apps/trade-directory/enums/lending-product.enum';
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
} from 'typeorm';
import { Organization } from './organization.entity';
import { Relationship } from './relationship.entity';

// FACILITY_AGREEMENT: firstParty = Funder org, secondParty = Client org, lendingProduct set.
// COMMERCIAL: org <-> org trade contract, optionally linked to its relationship row.
// Access (future dynamic RBAC): RELATIONSHIP_MANAGER manage, RISK_OFFICER read.
@Entity()
export class Contract extends AbstractEntity<Contract> {
  // Tenant scope.
  @Index()
  @Column({ type: 'integer' })
  funderPersonaId: number;

  @Column({
    type: 'enum',
    enum: ContractTypeEnum,
    enumName: 'ContractTypeEnum',
  })
  contractType: ContractTypeEnum;

  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: 'firstPartyOrganizationId' })
  firstPartyOrganization?: Organization;

  @RelationId((contract: Contract) => contract.firstPartyOrganization)
  @Column({ type: 'integer' })
  firstPartyOrganizationId: number;

  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: 'secondPartyOrganizationId' })
  secondPartyOrganization?: Organization;

  @RelationId((contract: Contract) => contract.secondPartyOrganization)
  @Column({ type: 'integer' })
  secondPartyOrganizationId: number;

  @ManyToOne(() => Relationship, { nullable: true })
  @JoinColumn({ name: 'relationshipId' })
  relationship?: Relationship;

  @RelationId((contract: Contract) => contract.relationship)
  @Column({ type: 'integer', nullable: true })
  relationshipId?: number;

  @Column({
    type: 'enum',
    enum: LendingProductEnum,
    enumName: 'LendingProductEnum',
    nullable: true,
  })
  lendingProduct?: LendingProductEnum;

  @Column({ type: 'varchar', nullable: true })
  reference?: string;

  @Column({ type: 'date', nullable: true })
  startDate?: string;

  @Column({ type: 'date', nullable: true })
  endDate?: string;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: new NumericTransformer(),
  })
  contractValue?: number;

  @Column({
    type: 'enum',
    enum: CurrencyCodeEnum,
    enumName: 'CurrencyCodeEnum',
    nullable: true,
  })
  currency?: CurrencyCodeEnum;

  @Column({ type: 'integer', nullable: true })
  paymentTermsDays?: number;

  @Column({
    type: 'enum',
    enum: ContractStatusEnum,
    enumName: 'ContractStatusEnum',
    default: ContractStatusEnum.DRAFT,
  })
  status: ContractStatusEnum;

  // document-management extraction requestId of the signed contract document.
  @Column({ type: 'varchar', nullable: true })
  documentReference?: string;

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
