import { AbstractEntity } from '@app/common/database/abstract.entity';
import { NumericTransformer } from '@app/common/utils/numeric-transformer';
import { rangeTransformer } from '@app/common/utils/range-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RiskQuantitativeProfileWeight } from './risk-quantitative-profile-weight.entity';
import { OrganizationCapitalSize } from '@app/common/apps/risk-operation/enums/organization-capital-size.enum';
import { CurrencyCodeEnum } from '@app/common/constants/currencies';
import { RiskQuantitativeThresholdRule } from './risk-quantitative-threshold-rule.entity';
import { BusinessSectorEnum } from '@app/common/apps/trade-directory/enums/business-sector.enum';
import { RiskApplicationScoring } from './risk-application-scoring.entity';

@Entity()
export class RiskProfile extends AbstractEntity<RiskProfile> {
  // ------------------ Relationship ------------------

  @OneToMany(
    () => RiskQuantitativeProfileWeight,
    (weight) => weight.riskProfile,
    {
      cascade: true,
      // eager: true, // 👈 auto-load RiskProfile when querying this entity
    },
  )
  riskQuantitativeProfileWeights: RiskQuantitativeProfileWeight[];

  @OneToMany(() => RiskQuantitativeThresholdRule, (rule) => rule.riskProfile, {
    cascade: true,
    // eager: true,
  })
  riskQuantitativeThresholdRules: RiskQuantitativeThresholdRule[];

  @OneToMany(() => RiskApplicationScoring, (scoring) => scoring.riskProfile)
  applicationScorings: RiskApplicationScoring[];

  // ------------------ Relationship ------------------

  @Column({ name: 'risk_profile_code', type: 'varchar', unique: true })
  riskProfileCode: string;

  @Column({
    name: 'business_sector',
    type: 'enum',
    enum: BusinessSectorEnum,
    enumName: 'BusinessSectorEnum',
    nullable: true,
  })
  businessSector: BusinessSectorEnum;

  @Column({ name: 'business_sector_other', type: 'varchar', nullable: true })
  businessSectorOther: string;

  @Column({
    name: 'capital_size',
    type: 'varchar',
    nullable: true,
  })
  capitalSize: string;

  @Column({
    name: 'capital_currency',
    type: 'enum',
    enum: CurrencyCodeEnum,
    enumName: 'CurrencyCodeEnum',
    nullable: true,
  })
  capitalCurrency: CurrencyCodeEnum;

  @Column({ name: 'is_default', type: 'integer' })
  isDefault: number;

  @Column({
    name: 'number_of_active_profiles',
    type: 'integer',
    default: 0,
  })
  numberOfActiveProfiles: number;

  @Column({
    name: 'low_risk_thresholds',
    type: 'numrange',
    transformer: rangeTransformer,
  })
  lowRiskThresholds: [number, number];

  @Column({
    name: 'medium_risk_thresholds',
    type: 'numrange',
    transformer: rangeTransformer,
  })
  mediumRiskThresholds: [number, number];

  @Column({
    name: 'high_risk_thresholds',
    type: 'numrange',
    transformer: rangeTransformer,
  })
  highRiskThresholds: [number, number];

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
    onUpdate: 'LOCALTIMESTAMP',
  })
  updatedAt: Date;
}
