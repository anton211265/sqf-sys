import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { GetOrganizationQueryDto } from './get-organization.dto';

export class GetOrganizationsQueryDto extends GetOrganizationQueryDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  organizationName?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  pageSize?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  pageNumber?: number;
}
