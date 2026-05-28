import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class GetApplicationsByOrgIdWithFilteringDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true') // Transform query string to boolean
  includeApplicationPerson?: boolean;

  @IsOptional()
  @IsString({ message: 'orderDirection must be a string.' })
  orderBy?: string; // Specifies the direction (e.g., 'ASC' or 'DESC')
}
