import { BusinessSectorEnum } from '@app/common/apps/trade-directory/enums/business-sector.enum';
import { OrganizationCompanySizeEnum } from '@app/common/apps/trade-directory/enums/organization-company-size.enum';
import { OrganizationMalaysiaRegionEnum } from '@app/common/apps/trade-directory/enums/organization-malaysia-region.enum';
import { OrganizationNatureOfBusinessEnum } from '@app/common/apps/trade-directory/enums/organization-nature-of-business.enum';
import { OrganizationTypeEnum } from '@app/common/apps/trade-directory/enums/organization-type.enum';
import { CountryCodeEnum } from '@app/common/constants/countries';
import { CurrencyCodeEnum } from '@app/common/constants/currencies';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class InitializeFactorOrganizationDto {
  @IsString()
  @IsNotEmpty()
  organizationName: string;

  @IsEnum(CountryCodeEnum)
  country: CountryCodeEnum;

  @IsString()
  @IsOptional()
  businessRegistrationNumber?: string;

  @IsEnum(OrganizationTypeEnum)
  @IsOptional()
  organizationType?: OrganizationTypeEnum;

  @IsString()
  @IsOptional()
  taxIdentificationNumber?: string;

  @IsEnum(BusinessSectorEnum)
  @IsOptional()
  organizationBusinessSector?: BusinessSectorEnum;

  @IsEnum(OrganizationNatureOfBusinessEnum)
  @IsOptional()
  natureOfBusiness?: OrganizationNatureOfBusinessEnum;

  @IsString()
  @IsOptional()
  registeredAddress?: string;

  @IsString()
  @IsOptional()
  postcode?: string;

  @IsString()
  @IsOptional()
  yearEstablished?: string;

  @IsEnum(CurrencyCodeEnum)
  @IsOptional()
  revenueCurrency?: CurrencyCodeEnum;

  @IsNumber()
  @IsOptional()
  revenueAmount?: number;

  @IsEmail()
  @IsOptional()
  emailAddress?: string;

  @IsString()
  @IsOptional()
  contactNumber?: string;

  @IsEnum(OrganizationCompanySizeEnum)
  @IsOptional()
  companySize?: OrganizationCompanySizeEnum;

  @IsString()
  @IsOptional()
  organizationWebsite?: string;

  @IsString()
  @IsOptional()
  sstRegistrationNumber?: string;

  @IsString()
  @IsOptional()
  alias?: string;

  @IsString()
  @IsOptional()
  coreBusiness?: string;

  @IsEnum(OrganizationMalaysiaRegionEnum)
  @IsOptional()
  malaysiaRegion?: OrganizationMalaysiaRegionEnum;

  @IsString()
  @IsOptional()
  businessAddress?: string;
}

export class InitializeSuperAdminDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  designation?: string;
}

export class InitializeSystemDto {
  @ValidateNested()
  @Type(() => InitializeFactorOrganizationDto)
  organization: InitializeFactorOrganizationDto;

  @ValidateNested()
  @Type(() => InitializeSuperAdminDto)
  superAdmin: InitializeSuperAdminDto;
}
