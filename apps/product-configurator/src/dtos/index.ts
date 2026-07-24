import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  ChargeBasisEnum,
  DeductionRuleEnum,
  RateUpdateModeEnum,
} from '../models/billing.entities';
import { CalendarDayTypeEnum } from '../models/calendar.entities';
import {
  BankCountryMatchModeEnum,
  CorporateEmailModeEnum,
  DayCountConventionEnum,
  RolloverRuleEnum,
} from '../models/funder-config-settings.entity';
import {
  ApprovalModeEnum,
  RiskBandEnum,
  SlaWindowUnitEnum,
} from '../models/governance.entities';
import { FormulaTypeEnum } from '../models/master-rate-card.entity';

// Reminder (see CLAUDE.md, Dynamic RBAC gotcha): the global
// ValidationPipe({ whitelist: true }) STRIPS any property without a
// class-validator decorator — every property here must carry one.

export class CreateProductDto {
  @Matches(/^[A-Z][A-Z0-9]{1,9}$/, {
    message: 'productCode must be 2-10 uppercase alphanumerics',
  })
  productCode: string;

  @IsString()
  @MaxLength(100)
  productName: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  productName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  changeReason?: string;
}

export class RateCardFieldsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  interestRateApr?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  advanceRatePct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  discountFeePct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  oneTimeAdminFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  reserveRetainPct?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  minTenureDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  maxTenureDays?: number;

  @IsOptional()
  @IsIn(Object.values(FormulaTypeEnum))
  formulaType?: FormulaTypeEnum;

  @IsOptional()
  @IsArray()
  customVariables?: { key: string; value: string }[];

  @IsOptional()
  @IsBoolean()
  configuredByAgent?: boolean;

  @IsOptional()
  @IsString()
  changeReason?: string;
}

export class CreateBespokeProductDto extends RateCardFieldsDto {
  @IsInt()
  clientOwnerOrganizationId: number;

  @IsString()
  @MaxLength(100)
  productName: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateTemplateDto {
  @Matches(/^[A-Z0-9_]{2,50}$/, {
    message: 'documentCode must be 2-50 uppercase alphanumerics/underscores',
  })
  documentCode: string;

  @IsString()
  @MaxLength(150)
  documentName: string;

  @IsOptional()
  @IsString()
  templateFileUrl?: string;

  @IsOptional()
  @IsString()
  templateBody?: string;

  @IsOptional()
  @IsBoolean()
  isRequiredDefault?: boolean;
}

export class BindTemplatesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  templateIds: number[];
}

export class CreateAssignmentDto {
  @IsInt()
  organizationId: number;

  @IsInt()
  productId: number;

  @IsOptional()
  @IsString()
  changeReason?: string;
}

// ---- Billing & Fee Execution Engine ----

export class UpsertRateIndexDto {
  @Matches(/^[A-Z0-9_]{2,20}$/, {
    message: 'indexCode must be 2-20 uppercase alphanumerics/underscores',
  })
  indexCode: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  ratePct: number; // fraction: 0.0531 = 5.31%

  @IsOptional()
  @IsIn(Object.values(RateUpdateModeEnum))
  updateMode?: RateUpdateModeEnum;
}

export class UpsertFeeDto {
  @Matches(/^[A-Z0-9_]{2,40}$/, {
    message: 'feeCode must be 2-40 uppercase alphanumerics/underscores',
  })
  feeCode: string;

  @IsString()
  @MaxLength(150)
  feeName: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsIn(Object.values(ChargeBasisEnum))
  chargeBasis?: ChargeBasisEnum;

  @IsOptional()
  @IsIn(Object.values(DeductionRuleEnum))
  deductionRule?: DeductionRuleEnum;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class BillingSettingsDto {
  @IsOptional()
  @IsIn(Object.values(DayCountConventionEnum))
  dayCountConvention?: DayCountConventionEnum;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  penaltyMarginPct?: number;
}

// ---- Global Clearing Calendar ----

export class UpsertCalendarDayDto {
  @Matches(/^[A-Z]{2,30}$/, {
    message: 'region must be 2-30 uppercase letters (e.g. UK, US, MY)',
  })
  region: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dayDate must be YYYY-MM-DD' })
  dayDate: string;

  @IsOptional()
  @IsIn(Object.values(CalendarDayTypeEnum))
  dayType?: CalendarDayTypeEnum;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  description?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'cutoffTime must be HH:MM' })
  cutoffTime?: string;
}

export class CalendarSettingsDto {
  @IsIn(Object.values(RolloverRuleEnum))
  rolloverRule: RolloverRuleEnum;
}

// ---- Governance Policies ----

export class UpsertSlaDto {
  @Matches(/^[A-Z0-9_]{2,60}$/, {
    message: 'slaCode must be 2-60 uppercase alphanumerics/underscores',
  })
  slaCode: string;

  @IsString()
  @MaxLength(150)
  slaName: string;

  @IsInt()
  @Min(1)
  windowValue: number;

  @IsOptional()
  @IsIn(Object.values(SlaWindowUnitEnum))
  windowUnit?: SlaWindowUnitEnum;

  @IsString()
  @MaxLength(200)
  breachAction: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpsertApprovalRuleDto {
  @IsOptional()
  @IsInt()
  id?: number; // present = update, absent = create

  @Matches(/^[A-Z0-9_]{2,60}$/, {
    message: 'scope must be 2-60 uppercase alphanumerics/underscores',
  })
  scope: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  thresholdAmount?: number;

  @IsInt()
  @Min(1)
  requiredApprovals: number;

  @IsOptional()
  @IsIn(Object.values(ApprovalModeEnum))
  mode?: ApprovalModeEnum;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}

export class UpsertCreditRangeDto {
  @Matches(/^[A-Z][A-Z0-9_]{1,9}$/, {
    message: 'productCode must be 2-10 uppercase alphanumerics',
  })
  productCode: string;

  @IsIn(Object.values(RiskBandEnum))
  riskBand: RiskBandEnum;

  @IsNumber()
  @Min(0)
  minLimit: number;

  @IsNumber()
  @Min(0)
  maxLimit: number;
}

export class PolicySettingsDto {
  @IsOptional()
  @IsIn(Object.values(BankCountryMatchModeEnum))
  bankCountryMatchMode?: BankCountryMatchModeEnum;

  @IsOptional()
  @IsIn(Object.values(CorporateEmailModeEnum))
  corporateEmailMode?: CorporateEmailModeEnum;
}
