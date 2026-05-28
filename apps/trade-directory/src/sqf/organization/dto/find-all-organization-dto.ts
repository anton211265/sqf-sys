import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class FindAllOrganizationsDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10)) // Ensure the value is a number, and is treated as a base-10 number
  @IsInt({ message: 'Page number must be an integer.' })
  @Min(1, { message: 'Page number must be 1 or greater.' })
  page: number; // Default to page 1

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10)) // Ensure the value is a number
  @IsInt({ message: 'Page size must be an integer.' })
  @Min(1, { message: 'Page size must be 1 or greater.' })
  pageSize: number; // Default to 15 items per page
}