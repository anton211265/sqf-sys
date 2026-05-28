import { Type } from 'class-transformer';
import { IsDefined, IsNumber, IsOptional, Min } from 'class-validator';

export class GetPersonSupportingDocumentsQueryDto {
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

export class GetPersonSupportingDocumentsParamsDto {
  @IsNumber()
  @Type(() => Number)
  @IsDefined()
  personId: number;
}
