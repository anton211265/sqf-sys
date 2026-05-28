import { Type } from 'class-transformer';
import {
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class GetBankAccountsQueryDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  accountHolderName?: string;

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

export class GetBankAccountsParamsDto {
  @IsNumber()
  @Type(() => Number)
  @IsDefined()
  organizationId: number;
}
