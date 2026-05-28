import { BooleanTransformer } from '@app/common/utils/boolean-transformer';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class GetApplicationsQueryDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  clientOrganizationName?: string;

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

  @IsBoolean()
  @BooleanTransformer()
  @IsOptional()
  includeClientAwarderContract?: boolean;

  @IsBoolean()
  @BooleanTransformer()
  @IsOptional()
  includeFacilities?: boolean;
}
