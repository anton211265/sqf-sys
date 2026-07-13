import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class FindOrganizationByIdDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')  // Transform query string to boolean
  includeApplications?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true') 
  includeKycAgencyReports?: boolean;
}