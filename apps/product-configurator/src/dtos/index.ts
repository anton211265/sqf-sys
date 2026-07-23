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
