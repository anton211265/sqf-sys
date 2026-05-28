import { OrganizationTypeEnum } from '@app/common/apps/trade-directory/enums/organization-type.enum';
import { CountryCodeEnum } from '@app/common/constants/countries';
import { Transform } from 'class-transformer';
import { IsDefined, IsEnum, IsString } from 'class-validator';

export class CreateOrganizationDto {
  @IsDefined()
  @IsString()
  @Transform(({ value }) => value.toUpperCase())
  organizationName: string;

  @IsDefined()
  @IsString()
  businessRegistrationNumber: string;

  // @IsDefined()
  // @IsEmail()
  // emailAddress: string;

  @IsDefined()
  @IsString()
  @IsEnum(OrganizationTypeEnum)
  organizationType: OrganizationTypeEnum;

  @IsDefined()
  country: CountryCodeEnum;
}
