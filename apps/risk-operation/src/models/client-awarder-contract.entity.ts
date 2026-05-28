import { ClientAwarderContractAssignmentMethodEnum } from '@app/common/apps/risk-operation/enums/client-awarder-contract-assignment-method.enum';
import { ClientAwarderContractCollectionMethodEnum } from '@app/common/apps/risk-operation/enums/client-awarder-contract-collection-method.enum';
import { ClientAwarderContractFundingChannelEnum } from '@app/common/apps/risk-operation/enums/client-awarder-contract-funding-channel.enum';
import { ClientAwarderContractNatureEnum } from '@app/common/apps/risk-operation/enums/client-awarder-contract-nature.enum';
import { ClientAwarderContractTypeEnum } from '@app/common/apps/risk-operation/enums/client-awarder-contract-type.enum';
import { UpdatableOrganizationPerson } from '@app/common/apps/trade-directory/types/organization-person.type';
import {
  Organization,
  UpdatableOrganization,
} from '@app/common/apps/trade-directory/types/organization.type';
import { UpdatablePerson } from '@app/common/apps/trade-directory/types/person.type';
import { CurrencyCodeEnum } from '@app/common/constants/currencies';
import { AbstractEntity } from '@app/common/database/abstract.entity';
import { NumericTransformer } from '@app/common/utils/numeric-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { Application } from './application.entity';

export type ClientAwarderContractVariationOrder = {
  variationOrderStartDate: Date;
  variationOrderEndDate: Date;
  variationOrderValue: number;
  variationOrderCurrency: CurrencyCodeEnum;
};

@Entity()
export class ClientAwarderContract extends AbstractEntity<ClientAwarderContract> {
  @Column({ type: 'varchar', nullable: true })
  contractTitle?: string;

  @Column({ type: 'varchar', nullable: true })
  contractNumber?: string;

  @Column({
    type: 'enum',
    enum: ClientAwarderContractTypeEnum,
    enumName: 'ClientAwarderContractTypeEnum',
    nullable: true,
  })
  contractType?: ClientAwarderContractTypeEnum;

  @Column({ type: 'varchar', nullable: true })
  contractTypeOther?: string;

  @Column({
    type: 'enum',
    enum: ClientAwarderContractNatureEnum,
    enumName: 'ClientAwarderContractNatureEnum',
    nullable: true,
  })
  contractNature?: ClientAwarderContractNatureEnum;

  @Column({ type: 'varchar', nullable: true })
  contractStatus?: string;

  @Column({
    type: 'enum',
    enum: ClientAwarderContractAssignmentMethodEnum,
    enumName: 'ClientAwarderContractAssignmentMethodEnum',
    nullable: true,
  })
  assignmentMethod?: ClientAwarderContractAssignmentMethodEnum;

  @Column({
    type: 'enum',
    enum: ClientAwarderContractFundingChannelEnum,
    enumName: 'ClientAwarderContractFundingChannelEnum',
    nullable: true,
  })
  fundingChannel?: ClientAwarderContractFundingChannelEnum;

  @Column({
    type: 'enum',
    enum: ClientAwarderContractCollectionMethodEnum,
    enumName: 'ClientAwarderContractCollectionMethodEnum',
    nullable: true,
  })
  collectionMethod?: ClientAwarderContractCollectionMethodEnum;

  @Column({ type: 'timestamp without time zone', nullable: true })
  contractStartDate?: Date;

  @Column({ type: 'timestamp without time zone', nullable: true })
  contractEndDate?: Date;

  @Column({ type: 'timestamp without time zone', nullable: true })
  extensionOfTenure?: Date;

  @Column({ type: 'timestamp without time zone', nullable: true })
  contractSigningDate?: Date;

  @Column({
    type: 'numeric',
    transformer: new NumericTransformer(),
    nullable: true,
  })
  totalContractValue?: number;

  @Column({
    type: 'numeric',
    transformer: new NumericTransformer(),
    nullable: true,
  })
  totalContractValueClaimed?: number;

  @Column({
    type: 'enum',
    enum: CurrencyCodeEnum,
    enumName: 'CurrencyCodeEnum',
    default: CurrencyCodeEnum.MYR,
  })
  totalContractValueCurrency: CurrencyCodeEnum;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  variationOrders?: ClientAwarderContractVariationOrder[];

  @Column({ type: 'varchar', nullable: true })
  remark?: string;

  @OneToMany(
    () => Application,
    (application) => application.clientAwarderContract,
    { cascade: ['insert', 'update'] },
  )
  applications: Application[];

  // microservice
  @Column({
    type: 'integer',
  })
  clientPersonaId: number;
  clientOrganization?: Organization;

  @Column({ type: 'varchar' })
  clientOrganizationName: string;

  @Column({ type: 'jsonb', nullable: true })
  contractAwarder?: {
    organization: UpdatableOrganization;
    personInCharge: {
      person: UpdatablePerson;
      organizationPerson: UpdatableOrganizationPerson;
    }[];
    keyManagementPersonnel: {
      person: UpdatablePerson;
      organizationPerson: UpdatableOrganizationPerson;
    }[];
  };

  @Column({ type: 'jsonb', nullable: true })
  suppliers?: {
    organization: UpdatableOrganization;
    personInCharge: {
      person: UpdatablePerson;
      organizationPerson: UpdatableOrganizationPerson;
    }[];
  }[];

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
