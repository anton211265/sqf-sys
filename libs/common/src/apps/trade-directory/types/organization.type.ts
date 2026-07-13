import { ApiProperty } from '@nestjs/swagger';
import { Organization as TradeDirectoryOrganization } from 'apps/trade-directory/src/models';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import { CountryCodeEnum } from '@app/common/constants/countries';
import { OrganizationBusinessSectorEnum } from '../enums/organization-business-sector.enum';
import { OrganizationMalaysiaRegionEnum } from '../enums/organization-malaysia-region.enum';
import { OrganizationNatureOfBusinessEnum } from '../enums/organization-nature-of-business.enum';
import { OrganizationTypeEnum } from '../enums/organization-type.enum';

// ----------------------- SQF -----------------------

export type CreateOrganizationType = {
  organizationName: string;
  businessRegistrationNumber: string;
  // emailAddress: string;
  organizationType: OrganizationTypeEnum;
  country: CountryCodeEnum       // To delete: temp fix as country column cannot be null
};

// ----------------------- SQF -----------------------

export class UpdatableOrganization {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  organizationName?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  alias?: string;

  @ApiProperty({
    enum: CountryCodeEnum,
  })
  @IsEnum(CountryCodeEnum)
  @IsOptional()
  country?: CountryCodeEnum;

  @ApiProperty({
    enum: OrganizationTypeEnum,
  })
  @IsEnum(OrganizationTypeEnum)
  @IsOptional()
  organizationType?: OrganizationTypeEnum;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  organizationTypeOther?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  businessRegistrationNumber?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  taxIdentificationNumber?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  sstRegistrationNumber?: string;

  @ApiProperty({
    enum: OrganizationBusinessSectorEnum,
  })
  @IsEnum(OrganizationBusinessSectorEnum)
  @IsOptional()
  businessSector?: OrganizationBusinessSectorEnum;

  @ApiProperty({
    enum: OrganizationNatureOfBusinessEnum,
  })
  @IsEnum(OrganizationNatureOfBusinessEnum)
  @IsOptional()
  natureOfBusiness?: OrganizationNatureOfBusinessEnum;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  coreBusiness?: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  incorporationDate?: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  operationStartDate?: Date;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  businessAddress?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  registeredAddress?: string;

  @ApiProperty({
    enum: OrganizationMalaysiaRegionEnum,
  })
  @IsEnum(OrganizationMalaysiaRegionEnum)
  @IsOptional()
  malaysiaRegion?: OrganizationMalaysiaRegionEnum;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  factoryAddress?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  organizationWebsite?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  organizationLogo?: string;
}

export type Organization = TradeDirectoryOrganization;

