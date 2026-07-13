import { ContractStatusEnum } from '@app/common/apps/trade-directory/enums/contract-status.enum';
import { ContractTypeEnum } from '@app/common/apps/trade-directory/enums/contract-type.enum';
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

export class CreateContractDto {
  @ApiProperty({ enum: ContractTypeEnum })
  @IsEnum(ContractTypeEnum)
  @IsNotEmpty()
  contractType: ContractTypeEnum;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  firstPartyOrganizationId: number;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  secondPartyOrganizationId: number;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  relationshipId?: number;

  @ApiProperty({ enum: LendingProductEnum, required: false })
  @IsEnum(LendingProductEnum)
  @IsOptional()
  lendingProduct?: LendingProductEnum;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  contractValue?: number;

  @ApiProperty({ enum: CurrencyCodeEnum, required: false })
  @IsEnum(CurrencyCodeEnum)
  @IsOptional()
  currency?: CurrencyCodeEnum;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  paymentTermsDays?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  documentReference?: string;
}

export class UpdateContractDto {
  @ApiProperty({ enum: ContractStatusEnum, required: false })
  @IsEnum(ContractStatusEnum)
  @IsOptional()
  status?: ContractStatusEnum;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  contractValue?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  paymentTermsDays?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  documentReference?: string;
}
