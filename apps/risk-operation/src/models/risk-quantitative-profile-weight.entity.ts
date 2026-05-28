import { AbstractEntity } from '@app/common/database/abstract.entity';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { RiskProfile } from './risk-profile.entity'; // Adjust the path as needed
import { RiskQuantitativeParameter } from './risk-quantitative-parameter.entity'; // Adjust the path as needed
import { RiskQuantitativeSubParameter } from './risk-quantitative-sub-parameter.entity';

@Entity()
export class RiskQuantitativeProfileWeight extends AbstractEntity<RiskQuantitativeProfileWeight> {
  //  ------------------ Relationship ------------------

  @ManyToOne(
    () => RiskProfile,
    (riskProfile) => riskProfile.riskQuantitativeProfileWeights,
    {
      onDelete: 'CASCADE', // when parent RiskProfile is deleted, all child rows in RiskQuantitativeProfileWeight that reference it will be automatically deleted in the database
    },
  )
  @JoinColumn({ name: 'risk_profile_id' })
  riskProfile: RiskProfile;

  @ManyToOne(
    () => RiskQuantitativeParameter,
    (param) => param.riskQuantitativeProfileWeights,
    { eager: true },
  )
  @JoinColumn({ name: 'quantitative_parameter_id' })
  quantitativeParameter: RiskQuantitativeParameter;

  @ManyToOne(
    () => RiskQuantitativeSubParameter,
    (subParam) => subParam.riskQuantitativeProfileWeights,
    // { eager: true },
  )
  @JoinColumn({ name: 'quantitative_sub_parameter_id' })
  quantitativeSubParameter: RiskQuantitativeSubParameter;

  //  ------------------ Relationship ------------------

  @Column({ name: 'risk_profile_id', type: 'int' })
  riskProfileId: number;

  @Column({ name: 'quantitative_parameter_id', type: 'int' })
  quantitativeParameterId: number;

  @Column({
    name: 'quantitative_sub_parameter_id',
    type: 'int',
    nullable: true,
  })
  quantitativeSubParameterId: number;

  @Column({ name: 'weight', type: 'numeric' })
  weight: number;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({
    name: 'updated_at',

    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
