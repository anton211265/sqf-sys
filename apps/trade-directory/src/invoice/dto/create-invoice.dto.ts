import { InvoiceStatusEnum } from '@app/common/apps/trade-directory/enums/invoice-status.enum';
import { LendingProductEnum } from '@app/common/apps/trade-directory/enums/lending-product.enum';
import { CurrencyCodeEnum } from '@app/common/constants/currencies';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  issuerOrganizationId: number;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  debtorOrganizationId: number;

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

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ enum: CurrencyCodeEnum })
  @IsEnum(CurrencyCodeEnum)
  @IsNotEmpty()
  currency: CurrencyCodeEnum;

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
  sourceDocumentReference?: string;
}

export class UpdateInvoiceStatusDto {
  @ApiProperty({ enum: InvoiceStatusEnum })
  @IsEnum(InvoiceStatusEnum)
  @IsNotEmpty()
  status: InvoiceStatusEnum;
}
