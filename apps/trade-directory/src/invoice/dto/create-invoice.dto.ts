import { InvoiceStatusEnum } from '@app/common/apps/trade-directory/enums/invoice-status.enum';
import { InvoiceTypeCodeEnum } from '@app/common/apps/trade-directory/enums/invoice-type-code.enum';
import { LendingProductEnum } from '@app/common/apps/trade-directory/enums/lending-product.enum';
import { TaxCategoryEnum } from '@app/common/apps/trade-directory/enums/tax-category.enum';
import { CurrencyCodeEnum } from '@app/common/constants/currencies';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { NewOrganizationDto } from './new-organization.dto';
import { PartyOverrideDto } from './party-override.dto';

// One invoiced line (cac:InvoiceLine core subset). lineExtensionAmount and the
// header's LegalMonetaryTotal are computed server-side from these — callers
// never submit totals directly, so they can't drift from the lines that back
// them (see InvoiceService.buildLinesAndTotals).
export class CreateInvoiceLineDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  itemDescription?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.0001)
  invoicedQuantity: number;

  @ApiProperty({ default: 'EA', description: 'UN/ECE Rec 20 unit code' })
  @IsString()
  @IsOptional()
  invoicedQuantityUnitCode?: string = 'EA';

  @ApiProperty({ description: 'Unit price excluding tax' })
  @IsNumber()
  @Min(0)
  priceAmount: number;

  @ApiProperty({ enum: TaxCategoryEnum, default: TaxCategoryEnum.STANDARD })
  @IsEnum(TaxCategoryEnum)
  @IsOptional()
  taxCategoryId?: TaxCategoryEnum = TaxCategoryEnum.STANDARD;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  taxPercent?: number = 0;

  @ApiProperty({ default: 'VAT' })
  @IsString()
  @IsOptional()
  taxSchemeId?: string = 'VAT';
}

export class CreateInvoiceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  // Exactly one of issuerOrganizationId / newIssuerOrganization must be
  // supplied (enforced in InvoiceService.create(), not here — this codebase
  // has no existing cross-field validator pattern to match). Same for the
  // debtor pair below.
  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  issuerOrganizationId?: number;

  @ApiProperty({ type: NewOrganizationDto, required: false })
  @ValidateNested()
  @Type(() => NewOrganizationDto)
  @IsOptional()
  newIssuerOrganization?: NewOrganizationDto;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  debtorOrganizationId?: number;

  @ApiProperty({ type: NewOrganizationDto, required: false })
  @ValidateNested()
  @Type(() => NewOrganizationDto)
  @IsOptional()
  newDebtorOrganization?: NewOrganizationDto;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  relationshipId?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  contractId?: number;

  @ApiProperty({ enum: LendingProductEnum, required: false })
  @IsEnum(LendingProductEnum)
  @IsOptional()
  lendingProduct?: LendingProductEnum;

  @ApiProperty({ enum: InvoiceTypeCodeEnum, default: InvoiceTypeCodeEnum.COMMERCIAL_INVOICE })
  @IsEnum(InvoiceTypeCodeEnum)
  @IsOptional()
  invoiceTypeCode?: InvoiceTypeCodeEnum = InvoiceTypeCodeEnum.COMMERCIAL_INVOICE;

  @ApiProperty({ enum: CurrencyCodeEnum })
  @IsEnum(CurrencyCodeEnum)
  @IsNotEmpty()
  documentCurrencyCode: CurrencyCodeEnum;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  issueDate: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  buyerReference?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  sourceDocumentReference?: string;

  // Overrides for the supplier/customer party snapshot — primarily for
  // document extraction, where the source document may show a different
  // registered name/address/VAT than the current Organization record.
  // Anything omitted falls back to the linked Organization (see
  // InvoiceService.buildPartySnapshot).
  @ApiProperty({ type: PartyOverrideDto, required: false })
  @ValidateNested()
  @Type(() => PartyOverrideDto)
  @IsOptional()
  supplierParty?: PartyOverrideDto;

  @ApiProperty({ type: PartyOverrideDto, required: false })
  @ValidateNested()
  @Type(() => PartyOverrideDto)
  @IsOptional()
  customerParty?: PartyOverrideDto;

  @ApiProperty({ type: [CreateInvoiceLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceLineDto)
  lines: CreateInvoiceLineDto[];
}

export class UpdateInvoiceStatusDto {
  @ApiProperty({ enum: InvoiceStatusEnum })
  @IsEnum(InvoiceStatusEnum)
  @IsNotEmpty()
  status: InvoiceStatusEnum;
}
