import {
  IsDefined,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';
import { OrganizationBusinessSectorEnum } from '@app/common/apps/trade-directory/enums/organization-business-sector.enum';
import { OrganizationTypeEnum } from '@app/common/apps/trade-directory/enums/organization-type.enum';
import { OrganizationCompanySizeEnum } from '@app/common/apps/trade-directory/enums/organization-company-size.enum';
import { CountryCodeEnum } from '@app/common/constants/countries';
import { CurrencyCodeEnum } from '@app/common/constants/currencies';
import { BusinessSectorEnum } from '@app/common/apps/trade-directory/enums/business-sector.enum';

export class UpdateOrganizationDto {
  @IsDefined()
  @IsNotEmpty()
  @IsEnum(Object.values(OrganizationTypeEnum))
  organizationType: OrganizationTypeEnum;

  @IsDefined()
  @IsString()
  @IsOptional()
  organizationTypeOther: string;

  @IsDefined()
  @IsNotEmpty()
  @IsEnum(Object.values(CountryCodeEnum))
  country: CountryCodeEnum;

  @IsDefined()
  @IsNotEmpty()
  @IsOptional()
  @IsEnum(Object.values(BusinessSectorEnum))
  organizationBusinessSector: BusinessSectorEnum;

  @IsOptional()
  @IsString()
  businessSectorOther?: string;

  @IsDefined()
  @IsEmail()
  emailAddress: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  contactNumber: string;

  @IsOptional()
  organizationWebsite?: string | null;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  registeredAddress?: string;

  @IsDefined()
  @IsString()
  @Length(5, 10)
  postcode?: string;

  @IsDefined()
  @IsEnum(Object.values(OrganizationCompanySizeEnum))
  companySize: OrganizationCompanySizeEnum;

  @IsDefined()
  @IsString()
  @Length(4)
  yearEstablished: string;

  @IsDefined()
  @IsEnum(Object.values(CurrencyCodeEnum))
  revenueCurrency?: CurrencyCodeEnum;

  @IsDefined()
  @IsNumber()
  revenueAmount?: number;

  @IsOptional()
  @IsString()
  taxIdentificationNumber?: string;
}
