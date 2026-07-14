import { OrganizationTypeEnum } from '@app/common/apps/trade-directory/enums/organization-type.enum';
import { CountryCodeEnum } from '@app/common/constants/countries';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Minimal payload to auto-create a bare, not-yet-onboarded Organization at
// invoice-creation time when the caller has no existing organizationId to
// reference. Deliberately lower-completeness than CreateOrganizationDto
// (sqf/organization, which requires businessRegistrationNumber/
// organizationType for real client onboarding) — only organizationName is
// required here. Gaps are expected to be filled in later via real KYC;
// fullyOnboardedAt stays null, same as every org in this system today.
export class NewOrganizationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  organizationName: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  businessRegistrationNumber?: string;

  @ApiProperty({ enum: CountryCodeEnum, required: false })
  @IsEnum(CountryCodeEnum)
  @IsOptional()
  country?: CountryCodeEnum;

  @ApiProperty({ enum: OrganizationTypeEnum, required: false })
  @IsEnum(OrganizationTypeEnum)
  @IsOptional()
  organizationType?: OrganizationTypeEnum;
}
