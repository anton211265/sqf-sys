import { DocumentClassEnum } from '@app/common/apps/document-management/enums/document-class.enum';
import { DocumentStatusEnum } from '@app/common/apps/document-management/enums/document-status.enum';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// Metadata search only (design decision 2026-07-19) — company, class,
// status, upload-date range, filename. Covers current and archived files;
// not full-text content search.
export class SearchDocumentsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  subjectOrganizationId?: number;

  @IsOptional()
  @IsEnum(DocumentClassEnum)
  documentClass?: DocumentClassEnum;

  @IsOptional()
  @IsEnum(DocumentStatusEnum)
  status?: DocumentStatusEnum;

  @IsOptional()
  @IsDateString()
  uploadedFrom?: string;

  @IsOptional()
  @IsDateString()
  uploadedTo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  refId?: string;
}
