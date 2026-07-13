import { CountryCodeEnum } from '@app/common/constants/countries';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

// Lets a caller (document extraction, primarily) override supplier/customer
// party fields with what the source document actually shows, rather than
// always taking the current Organization record. Every field is optional —
// InvoiceService.buildPartySnapshot fills anything omitted from the linked
// Organization, so a caller only needs to send fields that differ.
export class PartyOverrideDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  partyName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  registrationName?: string;

  @ApiProperty({ required: false, description: 'Company/business registration number' })
  @IsString()
  @IsOptional()
  companyId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  companyLegalForm?: string;

  @ApiProperty({ required: false, description: 'VAT identification number' })
  @IsString()
  @IsOptional()
  vatNumber?: string;

  @ApiProperty({ required: false, description: 'e.g. VAT, GST' })
  @IsString()
  @IsOptional()
  taxSchemeId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  streetName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  additionalStreetName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  buildingNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  cityName?: string;

  @ApiProperty({ required: false, description: 'Postal/zip code' })
  @IsString()
  @IsOptional()
  postalZone?: string;

  @ApiProperty({ required: false, description: 'State/province/region' })
  @IsString()
  @IsOptional()
  countrySubentity?: string;

  @ApiProperty({ enum: CountryCodeEnum, required: false })
  @IsEnum(CountryCodeEnum)
  @IsOptional()
  countryCode?: CountryCodeEnum;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  contactName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  contactTelephone?: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiProperty({ required: false, description: 'e.g. a Peppol participant ID' })
  @IsString()
  @IsOptional()
  endpointId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  endpointSchemeId?: string;
}
