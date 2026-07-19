import { DocumentClassEnum } from '@app/common/apps/document-management/enums/document-class.enum';
import { DocumentStatusEnum } from '@app/common/apps/document-management/enums/document-status.enum';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';

export class ListDocumentsDto {
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
}
