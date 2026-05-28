import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class GetFactorPersonasQueryDto {
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
