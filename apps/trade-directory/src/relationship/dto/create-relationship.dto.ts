import { RelationshipStatusEnum } from '@app/common/apps/trade-directory/enums/relationship-status.enum';
import { RelationshipTypeEnum } from '@app/common/apps/trade-directory/enums/relationship-type.enum';
import { CurrencyCodeEnum } from '@app/common/constants/currencies';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateRelationshipDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  fromOrganizationId: number;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  toOrganizationId: number;

  @ApiProperty({ enum: RelationshipTypeEnum, required: false })
  @IsEnum(RelationshipTypeEnum)
  @IsOptional()
  relationshipType?: RelationshipTypeEnum;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  paymentTermsDays?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  yearlyVolumeChangePct?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  totalTradeVolume?: number;

  @ApiProperty({ enum: CurrencyCodeEnum, required: false })
  @IsEnum(CurrencyCodeEnum)
  @IsOptional()
  tradeCurrency?: CurrencyCodeEnum;
}

export class UpdateRelationshipDto {
  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  paymentTermsDays?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  yearlyVolumeChangePct?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  totalTradeVolume?: number;

  @ApiProperty({ enum: CurrencyCodeEnum, required: false })
  @IsEnum(CurrencyCodeEnum)
  @IsOptional()
  tradeCurrency?: CurrencyCodeEnum;

  @ApiProperty({ enum: RelationshipStatusEnum, required: false })
  @IsEnum(RelationshipStatusEnum)
  @IsOptional()
  status?: RelationshipStatusEnum;
}
