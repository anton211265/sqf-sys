import { DocumentClassEnum } from '@app/common/apps/document-management/enums/document-class.enum';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadDocumentDto {
  @IsEnum(DocumentClassEnum)
  documentClass: DocumentClassEnum;

  // Multipart form fields arrive as strings — coerce.
  @Type(() => Number)
  @IsInt()
  subjectOrganizationId: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  refId?: string;
}
